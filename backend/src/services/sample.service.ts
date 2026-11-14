import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { resolveUserNames } from "../utils/resolveUserNames";
import { generateBarcodeDataUri } from "./barcode.service";
import * as sampleRepository from "../repositories/sample.repository";
import { toSampleRecord, type SampleWithRelations } from "../repositories/sample.repository";
import * as appointmentRepository from "../repositories/appointment.repository";
import { markReportReceivedIfPending } from "./report.service";
import type {
  BulkActionResult,
  ListSamplesParams,
  ListSamplesResult,
  SampleRecord,
  SampleStatusLogRecord,
} from "../types/sample.types";
import { smsOnSampleStatus } from "./orderSms.service";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

/** Attaches display names for the collected/received/rejected-by audit
 *  columns — same batched-lookup shape as `bill.service.ts#attachCreatedByNames`. */
async function attachActorNames(rows: SampleRecord[]): Promise<SampleRecord[]> {
  const ids = rows.flatMap((r) => [
    r.collectedByUserId,
    r.receivedByUserId,
    r.approvedByUserId,
    r.rejectedByUserId,
  ]);
  const nameById = await resolveUserNames(ids);
  if (nameById.size === 0) return rows;

  return rows.map((row) => ({
    ...row,
    collectedBy: row.collectedByUserId ? (nameById.get(row.collectedByUserId) ?? null) : null,
    receivedBy: row.receivedByUserId ? (nameById.get(row.receivedByUserId) ?? null) : null,
    approvedBy: row.approvedByUserId ? (nameById.get(row.approvedByUserId) ?? null) : null,
    rejectedBy: row.rejectedByUserId ? (nameById.get(row.rejectedByUserId) ?? null) : null,
  }));
}

export async function listSamples(params: ListSamplesParams): Promise<ListSamplesResult> {
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
    sampleRepository.listSamples({
      ...sharedFilter,
      view: params.view,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "desc",
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    sampleRepository.countSamplesByView(sharedFilter),
  ]);

  const mapped = await attachActorNames(rows.map(toSampleRecord));
  return { rows: mapped, total, counts };
}

/** Fetches every sample matching the filters (no pagination) — used by the
 *  Excel export endpoint. */
export async function listAllSamplesForExport(params: ListSamplesParams): Promise<SampleRecord[]> {
  const { rows } = await sampleRepository.listSamples({
    view: params.view,
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    isEmergency: params.isEmergency,
    organizationId: params.organizationId,
    sortBy: params.sortBy ?? "createdAt",
    sortDir: params.sortDir ?? "desc",
    skip: 0,
    take: 10000,
  });
  return attachActorNames(rows.map(toSampleRecord));
}

/** `scopeOrganizationId` is only ever set for a Collection Center portal
 *  caller — a sample belonging to another Organization 404s the same as a
 *  missing id (see patient.service.ts#getPatient for the same pattern). */
export async function getSample(id: string, scopeOrganizationId?: string): Promise<SampleRecord> {
  const sample = await sampleRepository.findSampleById(id);
  if (
    !sample ||
    (scopeOrganizationId && sample.appointment.patient.organizationId !== scopeOrganizationId)
  ) {
    throw ApiError.notFound("Sample not found");
  }
  const [withNames] = await attachActorNames([toSampleRecord(sample)]);
  return withNames as SampleRecord;
}

export async function getSamplesByAppointment(appointmentId: string): Promise<SampleRecord[]> {
  const samples = await sampleRepository.findSamplesByAppointmentId(appointmentId);
  return attachActorNames(samples.map(toSampleRecord));
}

export async function getSampleHistory(
  id: string,
  scopeOrganizationId?: string,
): Promise<SampleStatusLogRecord[]> {
  const sample = await sampleRepository.findSampleById(id);
  if (
    !sample ||
    (scopeOrganizationId && sample.appointment.patient.organizationId !== scopeOrganizationId)
  ) {
    throw ApiError.notFound("Sample not found");
  }
  const logs = await sampleRepository.listStatusLogsForSample(id);
  const nameById = await resolveUserNames(logs.map((l) => l.performedByUserId));

  return logs.map((log) => ({
    id: log.id,
    fromStatus: log.fromStatus,
    toStatus: log.toStatus,
    performedByUserId: log.performedByUserId,
    performedBy: log.performedByUserId ? (nameById.get(log.performedByUserId) ?? null) : null,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function getBarcodeForSample(
  id: string,
  scopeOrganizationId?: string,
): Promise<{ sampleNo: string; barcodeDataUri: string }> {
  const sample = await sampleRepository.findSampleById(id);
  if (
    !sample ||
    (scopeOrganizationId && sample.appointment.patient.organizationId !== scopeOrganizationId)
  ) {
    throw ApiError.notFound("Sample not found");
  }
  return {
    sampleNo: sample.sampleNo,
    barcodeDataUri: await generateBarcodeDataUri(sample.sampleNo),
  };
}

function assertBillNotCancelled(sample: SampleWithRelations): void {
  if (sample.appointment.bill?.status === "CANCELLED") {
    throw ApiError.badRequest("Cannot act on a sample whose bill has been cancelled");
  }
}

/** Rolls `Appointment.status` from REGISTERED to SAMPLE_COLLECTED once every
 *  Sample for that appointment is out of PENDING — reuses the existing
 *  `appointmentRepository.updateAppointmentStatus` verbatim, so the
 *  Appointment module itself needed zero changes. */
/** Rolls `Appointment.status` from REGISTERED to SAMPLE_COLLECTED once every
 *  Sample for that appointment is out of PENDING. Runs *after* the sample
 *  transition's own transaction has already committed (reusing the existing
 *  `appointmentRepository.updateAppointmentStatus` verbatim, which writes on
 *  the plain `prisma` client, not a transaction client) — the Appointment
 *  module itself needed zero changes, at the cost of this follow-up check
 *  not being part of the same atomic commit as the sample transition. */
async function rollAppointmentStatusForward(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.status !== "REGISTERED") return;

  const allCollected = await sampleRepository.areAllSamplesCollectedForAppointment(
    appointmentId,
    prisma as Prisma.TransactionClient,
  );
  if (allCollected) {
    await appointmentRepository.updateAppointmentStatus(appointmentId, "SAMPLE_COLLECTED");
  }
}

export async function collectSample(
  id: string,
  userId: string | null,
  scopeOrganizationId?: string,
): Promise<SampleRecord> {
  const existing = await sampleRepository.findSampleById(id);
  if (
    !existing ||
    (scopeOrganizationId && existing.appointment.patient.organizationId !== scopeOrganizationId)
  ) {
    throw ApiError.notFound("Sample not found");
  }
  assertBillNotCancelled(existing);

  const updated = await prisma.$transaction((tx) =>
    sampleRepository.transitionSample({
      id,
      allowedFromStatuses: ["PENDING"],
      toStatus: "COLLECTED",
      data: { status: "COLLECTED", collectedAt: new Date(), collectedByUserId: userId },
      performedByUserId: userId,
      tx,
    }),
  );

  await rollAppointmentStatusForward(existing.appointmentId);

  const [withNames] = await attachActorNames([toSampleRecord(updated)]);
  return withNames as SampleRecord;
}

export async function receiveSample(id: string, userId: string | null): Promise<SampleRecord> {
  const existing = await sampleRepository.findSampleById(id);
  if (!existing) {
    throw ApiError.notFound("Sample not found");
  }
  assertBillNotCancelled(existing);

  const updated = await prisma.$transaction((tx) =>
    sampleRepository.transitionSample({
      id,
      allowedFromStatuses: ["COLLECTED"],
      toStatus: "RECEIVED",
      data: { status: "RECEIVED", receivedAt: new Date(), receivedByUserId: userId },
      performedByUserId: userId,
      tx,
    }),
  );

  await markReportReceivedIfPending(existing.appointmentId);

  const [withNames] = await attachActorNames([toSampleRecord(updated)]);
  return withNames as SampleRecord;
}

/** QC step between Received and Processing — a sample must be Approved
 *  before any of its tests' reports can be created/entered (see
 *  `report.service.ts`'s per-test gate). */
export async function approveSample(id: string, userId: string | null): Promise<SampleRecord> {
  const existing = await sampleRepository.findSampleById(id);
  if (!existing) {
    throw ApiError.notFound("Sample not found");
  }
  assertBillNotCancelled(existing);

  const updated = await prisma.$transaction((tx) =>
    sampleRepository.transitionSample({
      id,
      allowedFromStatuses: ["RECEIVED"],
      toStatus: "APPROVED",
      data: { status: "APPROVED", approvedAt: new Date(), approvedByUserId: userId },
      performedByUserId: userId,
      tx,
    }),
  );
  void smsOnSampleStatus(id, "APPROVED");

  const [withNames] = await attachActorNames([toSampleRecord(updated)]);
  return withNames as SampleRecord;
}

export async function rejectSample(
  id: string,
  reason: string,
  userId: string | null,
): Promise<SampleRecord> {
  const existing = await sampleRepository.findSampleById(id);
  if (!existing) {
    throw ApiError.notFound("Sample not found");
  }
  assertBillNotCancelled(existing);

  const updated = await prisma.$transaction((tx) =>
    sampleRepository.transitionSample({
      id,
      allowedFromStatuses: ["PENDING", "COLLECTED", "RECEIVED", "APPROVED", "PROCESSING"],
      toStatus: "REJECTED",
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedByUserId: userId,
        rejectionReason: reason,
      },
      performedByUserId: userId,
      note: reason,
      tx,
    }),
  );
  void smsOnSampleStatus(id, "REJECTED");

  const [withNames] = await attachActorNames([toSampleRecord(updated)]);
  return withNames as SampleRecord;
}

async function runBulk(
  ids: string[],
  action: (id: string) => Promise<unknown>,
): Promise<BulkActionResult> {
  const succeeded: string[] = [];
  const failed: BulkActionResult["failed"] = [];

  for (const id of ids) {
    try {
      await action(id);
      succeeded.push(id);
    } catch (error) {
      failed.push({ id, reason: error instanceof ApiError ? error.message : "Unexpected error" });
    }
  }

  return { succeeded, failed };
}

export async function bulkCollectSamples(
  ids: string[],
  userId: string | null,
): Promise<BulkActionResult> {
  return runBulk(ids, (id) => collectSample(id, userId));
}

export async function bulkReceiveSamples(
  ids: string[],
  userId: string | null,
): Promise<BulkActionResult> {
  return runBulk(ids, (id) => receiveSample(id, userId));
}

export async function bulkApproveSamples(
  ids: string[],
  userId: string | null,
): Promise<BulkActionResult> {
  return runBulk(ids, (id) => approveSample(id, userId));
}
