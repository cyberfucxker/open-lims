import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { resolveUserNames } from "../utils/resolveUserNames";
import { evaluateFormula } from "../utils/formulaEvaluator";
import * as reportRepository from "../repositories/report.repository";
import { toReportDetails, toReportListItem } from "../repositories/report.repository";
import * as appointmentRepository from "../repositories/appointment.repository";
import { getReportSettings } from "./reportSettings.service";
import { notifyReportReady } from "./orderNotification.service";
import {
  generateReportBatchPdf,
  generateReportPdf,
  generateCombinedTestResultsPdf,
  type CombinedPdfOptions,
} from "./reportPdf.service";
import type {
  ApproveTestResultInput,
  ListReportsParams,
  ListReportsResult,
  ReportAuditLogRecord,
  ReportDetails,
  ReportListItem,
  SaveResultLineInput,
  SaveTestResultInput,
} from "../types/report.types";
import { smsOnReportReady } from "./orderSms.service";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const BLOCKING_SAMPLE_STATUSES = new Set(["PENDING", "REJECTED"]);
/** A test's own result can be (re-)entered while it's in one of these
 *  per-test states — mirrors the whole-report `EDITABLE_STATUSES` below, one
 *  level down. REJECTED stays editable so a sent-back test can be fixed and
 *  resubmitted without unlocking its approved siblings. */
const ROW_EDITABLE_STATUSES = new Set(["PENDING", "IN_PROGRESS", "REJECTED"]);

async function attachActorNames(reports: ReportDetails[]): Promise<ReportDetails[]>;
async function attachActorNames(reports: ReportListItem[]): Promise<ReportListItem[]>;
async function attachActorNames<T extends ReportListItem>(reports: T[]): Promise<T[]> {
  const ids = reports.flatMap((r) => [r.enteredByUserId, r.approvedByUserId]);
  const nameById = await resolveUserNames(ids);
  if (nameById.size === 0) return reports;

  return reports.map((report) => ({
    ...report,
    enteredBy: report.enteredByUserId ? (nameById.get(report.enteredByUserId) ?? null) : null,
    approvedBy: report.approvedByUserId ? (nameById.get(report.approvedByUserId) ?? null) : null,
  }));
}

export async function listReports(params: ListReportsParams): Promise<ListReportsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const sharedFilter = {
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    isEmergency: params.isEmergency,
    organizationId: params.organizationId,
  };

  const [{ rows, total }, counts] = await Promise.all([
    reportRepository.listReports({
      ...sharedFilter,
      view: params.view,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "desc",
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    reportRepository.countReportsByView(sharedFilter),
  ]);

  const mapped = await attachActorNames(rows.map(toReportListItem));
  return { rows: mapped, total, counts };
}

export async function listAllReportsForExport(
  params: ListReportsParams,
): Promise<ReportListItem[]> {
  const { rows } = await reportRepository.listReports({
    view: params.view,
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    isEmergency: params.isEmergency,
    sortBy: params.sortBy ?? "createdAt",
    sortDir: params.sortDir ?? "desc",
    skip: 0,
    take: 10000,
  });
  return attachActorNames(rows.map(toReportListItem));
}

/** A Test's TestParameter rows can be added any time — including after its
 *  ReportTestResult already exists — so a report is synced lazily on read
 *  instead of only at creation time (see `ensureReportForAppointment`'s
 *  doc-comment for the creation-time scaffold this complements). No-ops once
 *  every parameter already has a row. */
async function ensureParameterResultsScaffolded(reportId: string): Promise<void> {
  const report = await reportRepository.findReportById(reportId);
  if (!report) return;

  for (const result of report.results) {
    const parameters = await prisma.testParameter.findMany({
      where: { testId: result.testId },
      select: { id: true },
    });
    if (parameters.length === 0) continue;

    const existingIds = new Set(result.parameterResults.map((pr) => pr.testParameterId));
    const missing = parameters.filter((p) => !existingIds.has(p.id));
    if (missing.length === 0) continue;

    await prisma.reportParameterResult.createMany({
      data: missing.map((p) => ({ reportTestResultId: result.id, testParameterId: p.id })),
      skipDuplicates: true,
    });
  }
}

/** `scopeOrganizationId` is only ever set for a Collection Center portal
 *  caller — same 404-not-403 pattern as patient.service.ts#getPatient. */
export async function getReport(id: string, scopeOrganizationId?: string): Promise<ReportDetails> {
  let report = await reportRepository.findReportById(id);
  if (
    !report ||
    (scopeOrganizationId && report.appointment.patient.organizationId !== scopeOrganizationId)
  ) {
    throw ApiError.notFound("Report not found");
  }

  await ensureParameterResultsScaffolded(id);
  report = (await reportRepository.findReportById(id)) ?? report;

  const [withNames] = await attachActorNames([toReportDetails(report)]);
  return withNames as ReportDetails;
}

export async function getReportByAppointment(appointmentId: string): Promise<ReportDetails> {
  const report = await reportRepository.findReportByAppointmentId(appointmentId);
  if (!report) {
    throw ApiError.notFound("No report exists yet for this appointment");
  }

  return getReport(report.id);
}

export async function getReportHistory(id: string): Promise<ReportAuditLogRecord[]> {
  const report = await reportRepository.findReportById(id);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  const logs = await reportRepository.listAuditLogsForReport(id);
  const nameById = await resolveUserNames(logs.map((l) => l.performedByUserId));

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    performedByUserId: log.performedByUserId,
    performedBy: log.performedByUserId ? (nameById.get(log.performedByUserId) ?? null) : null,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  }));
}

const EDITABLE_STATUSES = new Set(["PENDING", "RECEIVED", "PROCESSING", "PARTIAL"]);

export async function saveResults(
  id: string,
  results: SaveResultLineInput[],
  userId: string | null,
): Promise<ReportDetails> {
  const report = await reportRepository.findReportById(id);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  if (!EDITABLE_STATUSES.has(report.status)) {
    throw ApiError.badRequest(`Cannot edit results while the report is ${report.status}`);
  }

  const byAppointmentTestId = new Map(report.results.map((r) => [r.appointmentTestId, r]));

  await prisma.$transaction(async (tx) => {
    for (const line of results) {
      const target = byAppointmentTestId.get(line.appointmentTestId);
      if (!target) {
        throw ApiError.badRequest("One or more result lines do not belong to this report");
      }
      await tx.reportTestResult.update({
        where: { id: target.id },
        data: {
          resultValue: line.resultValue ?? target.resultValue,
          unit: line.unit ?? target.unit,
          referenceRange: line.referenceRange ?? target.referenceRange,
          method: line.method ?? target.method,
          remarks: line.remarks ?? target.remarks,
          flag: line.flag ?? target.flag,
          isCritical: line.isCritical ?? target.isCritical,
          enteredByUserId: userId,
          enteredAt: new Date(),
        },
      });
    }

    const refreshed = await tx.reportTestResult.findMany({ where: { reportId: id } });
    const filled = refreshed.filter((r) => r.resultValue !== null && r.resultValue !== "").length;
    const nextStatus = filled === 0 ? "PROCESSING" : "PARTIAL";

    await tx.report.update({
      where: { id },
      data: {
        status: nextStatus,
        enteredByUserId: report.enteredByUserId ?? userId,
        enteredAt: report.enteredAt ? undefined : new Date(),
      },
    });
    await reportRepository.createAuditLog(id, "DRAFT_SAVED", userId, undefined, tx);
  });

  return getReport(id);
}

export async function submitReport(id: string, userId: string | null): Promise<ReportDetails> {
  const report = await reportRepository.findReportById(id);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  if (!EDITABLE_STATUSES.has(report.status)) {
    throw ApiError.badRequest(`Report cannot be submitted while it is ${report.status}`);
  }

  const unfilled = report.results.filter((r) => !r.resultValue);
  if (unfilled.length > 0) {
    throw ApiError.badRequest("Enter results for every test before submitting", {
      missingTestIds: unfilled.map((r) => r.testId),
    });
  }

  const blocked = report.results.filter(
    (r) => r.sample && BLOCKING_SAMPLE_STATUSES.has(r.sample.status),
  );
  if (blocked.length > 0) {
    throw ApiError.badRequest(
      "One or more samples are not yet received, or were rejected — cannot submit",
      {
        blockedTestIds: blocked.map((r) => r.testId),
      },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    await reportRepository.createAuditLog(id, "SUBMITTED", userId, undefined, tx);
  });

  return getReport(id);
}

/** `Report.appointmentId` -&gt; `AppOrderAppointment` (the join row, keyed
 *  uniquely by appointment) -&gt; its `AppOrder` -&gt; the patient's `AppUser`.
 *  Shared by every path that can make a report newly APPROVED — the
 *  explicit `approveReport` action and the auto-rollup in
 *  `recomputeReportStatus` (via `approveTestResult`) both funnel through
 *  here so the two paths can't drift on what "report ready" means. */
async function notifyReportReadyForAppointment(appointmentId: string): Promise<void> {
  void smsOnReportReady(appointmentId);
  const orderLink = await prisma.appOrderAppointment.findUnique({
    where: { appointmentId },
    select: { order: { select: { id: true, appUserId: true, orderNumber: true } } },
  });
  if (orderLink?.order) {
    await notifyReportReady(
      orderLink.order.appUserId,
      orderLink.order.id,
      orderLink.order.orderNumber,
    );
  }
}

export async function approveReport(id: string, userId: string | null): Promise<ReportDetails> {
  const report = await reportRepository.findReportById(id);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  if (report.status !== "SUBMITTED") {
    throw ApiError.badRequest("Only a submitted report can be approved");
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id },
      data: { status: "APPROVED", approvedByUserId: userId, approvedAt: new Date() },
    });
    await reportRepository.createAuditLog(id, "APPROVED", userId, undefined, tx);
  });

  await maybeCompleteAppointment(report.appointmentId);
  await notifyReportReadyForAppointment(report.appointmentId);

  return getReport(id);
}

export async function rejectReport(
  id: string,
  reason: string,
  userId: string | null,
): Promise<ReportDetails> {
  const report = await reportRepository.findReportById(id);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  if (report.status !== "SUBMITTED") {
    throw ApiError.badRequest("Only a submitted report can be sent back for revision");
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.update({ where: { id }, data: { status: "PROCESSING", submittedAt: null } });
    await reportRepository.createAuditLog(id, "REJECTED", userId, reason, tx);
  });

  return getReport(id);
}

/** Recomputes the whole-Report rollup status from its per-test
 *  `ReportTestResult.status` values so `Report.status` keeps meaning what
 *  every existing whole-report reader (tabs, Excel export, Group Print)
 *  already expects it to mean, without those readers needing to change.
 *  Never regresses a CANCELLED report, and never moves it backwards behind
 *  whatever stage the sample-received auto-bump already put it at.
 *
 *  Returns `justApproved: true` only the instant this call is what actually
 *  flips the report to APPROVED (not on every subsequent recompute once
 *  it's already there) — callers use that to fire the "report ready"
 *  notification exactly once, on the transition, from outside the
 *  transaction (see `approveTestResult`). */
async function recomputeReportStatus(
  reportId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<{ justApproved: boolean }> {
  const report = await tx.report.findUnique({ where: { id: reportId } });
  if (!report || report.status === "CANCELLED") return { justApproved: false };

  const rows = await tx.reportTestResult.findMany({ where: { reportId } });
  if (rows.length === 0) return { justApproved: false };

  const allApproved = rows.every((r) => r.status === "APPROVED");
  const allSubmittedOrApproved = rows.every(
    (r) => r.status === "SUBMITTED" || r.status === "APPROVED",
  );
  const anyStarted = rows.some((r) => r.status !== "PENDING");

  if (allApproved) {
    const latest = rows.reduce((a, b) =>
      (b.approvedAt?.getTime() ?? 0) > (a.approvedAt?.getTime() ?? 0) ? b : a,
    );
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: "APPROVED",
        approvedByUserId: latest.approvedByUserId,
        approvedAt: latest.approvedAt,
      },
    });
    return { justApproved: report.status !== "APPROVED" };
  } else if (allSubmittedOrApproved) {
    const latest = rows.reduce((a, b) =>
      (b.submittedAt?.getTime() ?? 0) > (a.submittedAt?.getTime() ?? 0) ? b : a,
    );
    await tx.report.update({
      where: { id: reportId },
      data: { status: "SUBMITTED", submittedAt: latest.submittedAt },
    });
  } else if (anyStarted && report.status !== "PARTIAL") {
    await tx.report.update({ where: { id: reportId }, data: { status: "PARTIAL" } });
  }

  return { justApproved: false };
}

function assertRowEditable(target: ReportDetails["results"][number]): void {
  if (!ROW_EDITABLE_STATUSES.has(target.status)) {
    throw ApiError.badRequest(`Cannot edit this test's result while it is ${target.status}`);
  }
  if (target.sampleStatus && target.sampleStatus !== "APPROVED") {
    throw ApiError.badRequest(
      "Sample for this test must be Approved before entering/submitting its result",
    );
  }
}

function findRowOrThrow(report: ReportDetails, resultId: string): ReportDetails["results"][number] {
  const target = report.results.find((r) => r.id === resultId);
  if (!target) {
    throw ApiError.notFound("Test result not found on this report");
  }
  return target;
}

/** Applies each attachment's `TestParameter.formula` (e.g. "(PCV*10)/RBC")
 *  against sibling parameter values already saved on this same test result.
 *  Formula-derived values aren't themselves fed back into other formulas in
 *  the same pass — a formula may only reference directly-entered values.
 *
 *  Formulas reference siblings by the linked `Parameter.shortName` (which is
 *  globally unique), so the lookup table is keyed on that. */
async function applyAutoCalculatedFormulas(
  tx: Prisma.TransactionClient,
  reportTestResultId: string,
  testId: string,
): Promise<void> {
  const [parameters, results] = await Promise.all([
    tx.testParameter.findMany({
      where: { testId },
      include: { parameter: { select: { shortName: true } } },
    }),
    tx.reportParameterResult.findMany({ where: { reportTestResultId } }),
  ]);

  const resultByParameterId = new Map(results.map((r) => [r.testParameterId, r]));
  const valueByShortCode: Record<string, number> = {};
  for (const parameter of parameters) {
    const result = resultByParameterId.get(parameter.id);
    const num = result?.resultValue ? Number(result.resultValue) : NaN;
    if (!Number.isNaN(num)) valueByShortCode[parameter.parameter.shortName] = num;
  }

  for (const parameter of parameters) {
    if (!parameter.formula) continue;
    const result = resultByParameterId.get(parameter.id);
    if (!result) continue;
    const computed = evaluateFormula(parameter.formula, valueByShortCode);
    if (computed === null) continue;
    await tx.reportParameterResult.update({
      where: { id: result.id },
      data: { resultValue: computed.toFixed(3) },
    });
  }
}

/** Saves one test's result independently of its siblings on the same bill —
 *  the "Create Report" step from the Generate Reports screen. Gated on the
 *  linked Sample being Approved (see `sample.service.ts#approveSample`). */
export async function saveTestResult(
  reportId: string,
  resultId: string,
  input: SaveTestResultInput,
  userId: string | null,
): Promise<ReportDetails> {
  const report = await getReport(reportId);
  const target = findRowOrThrow(report, resultId);
  assertRowEditable(target);

  await prisma.$transaction(async (tx) => {
    await tx.reportTestResult.update({
      where: { id: resultId },
      data: {
        resultValue: input.resultValue ?? target.resultValue,
        unit: input.unit ?? target.unit,
        referenceRange: input.referenceRange ?? target.referenceRange,
        method: input.method ?? target.method,
        remarks: input.remarks ?? target.remarks,
        flag: input.flag ?? target.flag,
        isCritical: input.isCritical ?? target.isCritical,
        status: "IN_PROGRESS",
        enteredByUserId: userId,
        enteredAt: new Date(),
      },
    });

    for (const parameter of input.parameters ?? []) {
      await tx.reportParameterResult.updateMany({
        where: { id: parameter.id, reportTestResultId: resultId },
        data: {
          resultValue: parameter.resultValue ?? null,
          machineValue: parameter.machineValue ?? null,
          flag: parameter.flag ?? "NORMAL",
          highlight: parameter.highlight ?? false,
        },
      });
    }

    if (input.autoCalculate && (input.parameters?.length ?? 0) > 0) {
      await applyAutoCalculatedFormulas(tx, resultId, target.testId);
    }

    await reportRepository.createAuditLog(
      reportId,
      "TEST_DRAFT_SAVED",
      userId,
      target.testName,
      tx,
    );
    await recomputeReportStatus(reportId, tx);
  });

  return getReport(reportId);
}

export async function submitTestResult(
  reportId: string,
  resultId: string,
  userId: string | null,
): Promise<ReportDetails> {
  const report = await getReport(reportId);
  const target = findRowOrThrow(report, resultId);
  assertRowEditable(target);

  const filled =
    target.parameters.length > 0
      ? target.parameters.every((p) => p.resultValue !== null && p.resultValue !== "")
      : Boolean(target.resultValue);
  if (!filled) {
    throw ApiError.badRequest("Enter all results for this test before submitting");
  }

  await prisma.$transaction(async (tx) => {
    await tx.reportTestResult.update({
      where: { id: resultId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    await reportRepository.createAuditLog(reportId, "TEST_SUBMITTED", userId, target.testName, tx);
    await recomputeReportStatus(reportId, tx);
  });

  return getReport(reportId);
}

export async function approveTestResult(
  reportId: string,
  resultId: string,
  input: ApproveTestResultInput,
  userId: string | null,
): Promise<ReportDetails> {
  const report = await getReport(reportId);
  const target = findRowOrThrow(report, resultId);
  if (target.status !== "SUBMITTED") {
    throw ApiError.badRequest("Only a submitted test can be approved");
  }

  const settings = await getReportSettings();
  const signatoryIds = [...new Set(input.signatoryIds)];
  if (signatoryIds.length < settings.minSignaturesRequired) {
    throw ApiError.badRequest(
      `At least ${settings.minSignaturesRequired} signature(s) required before approval`,
    );
  }

  let justApproved = false;
  await prisma.$transaction(async (tx) => {
    await tx.reportTestResultSignatory.deleteMany({ where: { reportTestResultId: resultId } });
    if (signatoryIds.length > 0) {
      await tx.reportTestResultSignatory.createMany({
        data: signatoryIds.map((signatoryId) => ({ reportTestResultId: resultId, signatoryId })),
        skipDuplicates: true,
      });
    }
    await tx.reportTestResult.update({
      where: { id: resultId },
      data: { status: "APPROVED", approvedByUserId: userId, approvedAt: new Date() },
    });
    await reportRepository.createAuditLog(reportId, "TEST_APPROVED", userId, target.testName, tx);
    ({ justApproved } = await recomputeReportStatus(reportId, tx));
  });

  await maybeCompleteAppointment(report.appointmentId);
  // The last individual test result being approved can, by itself, roll the
  // whole report to APPROVED (see `recomputeReportStatus`) without anyone
  // ever clicking the separate "Approve Report" action — this is that
  // path's own "report ready" notification, fired exactly once on the
  // transition.
  if (justApproved) {
    await notifyReportReadyForAppointment(report.appointmentId);
  }

  return getReport(reportId);
}

export async function rejectTestResult(
  reportId: string,
  resultId: string,
  reason: string,
  userId: string | null,
): Promise<ReportDetails> {
  const report = await getReport(reportId);
  const target = findRowOrThrow(report, resultId);
  if (target.status !== "SUBMITTED") {
    throw ApiError.badRequest("Only a submitted test can be sent back for revision");
  }

  await prisma.$transaction(async (tx) => {
    await tx.reportTestResult.update({
      where: { id: resultId },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectReason: reason, submittedAt: null },
    });
    await reportRepository.createAuditLog(reportId, "TEST_REJECTED", userId, reason, tx);
    await recomputeReportStatus(reportId, tx);
  });

  return getReport(reportId);
}

export async function cancelReport(
  id: string,
  reason: string,
  userId: string | null,
): Promise<ReportDetails> {
  const report = await reportRepository.findReportById(id);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  if (report.status === "PRINTED" || report.status === "CANCELLED") {
    throw ApiError.badRequest(`Cannot cancel a report that is already ${report.status}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.update({ where: { id }, data: { status: "CANCELLED", cancelReason: reason } });
    await reportRepository.createAuditLog(id, "CANCELLED", userId, reason, tx);
  });

  return getReport(id);
}

export async function markReportPrinted(id: string): Promise<ReportDetails> {
  const report = await reportRepository.findReportById(id);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  const nextStatus = report.status === "APPROVED" ? "PRINTED" : report.status;

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id },
      data: { printCount: { increment: 1 }, lastPrintedAt: new Date(), status: nextStatus },
    });
    await reportRepository.createAuditLog(id, "PRINTED", null, undefined, tx);
  });

  return getReport(id);
}

export async function generatePdfForReport(
  id: string,
  scopeOrganizationId?: string,
): Promise<{ buffer: Buffer; reportNo: string }> {
  const report = await getReport(id, scopeOrganizationId);
  const buffer = await generateReportPdf(report);
  return { buffer, reportNo: report.reportNo };
}

export async function generateBatchPdfForReports(ids: string[]): Promise<Buffer> {
  const reports = await Promise.all(ids.map((id) => getReport(id)));
  return generateReportBatchPdf(reports);
}

/** "Preview Selected Test" combined PDF — only ever includes tests from this
 *  one bill that are both selected AND Approved; silently drops any selected
 *  id that isn't (already-rejected/not-yet-approved rows can't sneak into a
 *  dispatched report just by being checked in the UI). */
export async function generateCombinedPdfForReport(
  id: string,
  resultIds: string[],
  options: CombinedPdfOptions,
): Promise<Buffer> {
  const report = await getReport(id);
  const approvedSelected = report.results
    .filter((r) => resultIds.includes(r.id) && r.status === "APPROVED")
    .map((r) => r.id);

  if (approvedSelected.length === 0) {
    throw ApiError.badRequest("Select at least one Approved test to include in the combined PDF");
  }

  return generateCombinedTestResultsPdf(report, approvedSelected, options);
}

/** Bumps a still-PENDING Report to RECEIVED the moment its first Sample is
 *  received — called from `sample.service.ts#receiveSample`. */
export async function markReportReceivedIfPending(appointmentId: string): Promise<void> {
  const report = await prisma.report.findUnique({ where: { appointmentId } });
  if (!report || report.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    await tx.report.update({ where: { id: report.id }, data: { status: "RECEIVED" } });
    await reportRepository.createAuditLog(report.id, "RECEIVED", null, "First sample received", tx);
  });
}

/** Rolls `Appointment.status` to COMPLETED once its Report is APPROVED —
 *  reuses the existing `appointmentRepository.updateAppointmentStatus`
 *  verbatim, same pattern as `sample.service.ts#rollAppointmentStatusForward`. */
async function maybeCompleteAppointment(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) return;
  if (appointment.status === "SAMPLE_COLLECTED" || appointment.status === "PROCESSING") {
    await appointmentRepository.updateAppointmentStatus(appointmentId, "COMPLETED");
  }
}
