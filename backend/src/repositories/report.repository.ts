import type {
  Appointment,
  AppointmentTest,
  Bill,
  Department,
  Parameter,
  Patient,
  Prisma,
  Report,
  ReportStatus as DbReportStatus,
  ReportParameterResult,
  ReportTestResult,
  Sample,
  Test,
  TestParameter,
} from "@prisma/client";
import { prisma } from "../config/database";
import { computeAge } from "./patient.repository";
import { fromDbGender } from "../utils/enumMappers";
import { nextReportNo } from "../utils/idGenerator";
import type {
  ReportDetails,
  ReportListItem,
  ReportParameterResultLine,
  ReportResultLine,
  ReportStatus,
  ReportTestResultSummary,
  ReportViewCounts,
  ReportViewStatus,
} from "../types/report.types";

const withListRelations = {
  appointment: {
    include: {
      patient: {
        select: {
          id: true,
          patientId: true,
          firstName: true,
          lastName: true,
          mobile: true,
          gender: true,
          dob: true,
          organizationId: true,
        },
      },
      bill: { select: { billNo: true } },
      tests: { select: { testId: true, testName: true } },
    },
  },
  results: {
    select: {
      id: true,
      testId: true,
      status: true,
      sampleId: true,
      test: { select: { name: true, shortName: true } },
      sample: { select: { sampleNo: true, status: true, collectedAt: true, receivedAt: true } },
    },
  },
  /// Filtered to just the "was this ever downloaded by the patient" check —
  /// powers the Reports Delivery Tracker, cheap since it's a `take: 1` on an
  /// already-indexed-by-reportId relation.
  auditLogs: {
    where: { action: "DOWNLOADED" },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.ReportInclude;

const withDetailRelations = {
  ...withListRelations,
  results: {
    include: {
      // `appCategory` is the fallback for a Test with no department — the
      // printed report groups results by department name, so it must never be
      // blank (see `toReportResultLine`).
      test: {
        select: {
          name: true,
          shortName: true,
          department: { select: { name: true } },
          appCategory: { select: { name: true } },
        },
      },
      sample: { select: { sampleNo: true, status: true, collectedAt: true, receivedAt: true } },
      // `TestParameter` is a Test<->Parameter join, so the analyte's own
      // name/shortName live one hop further out on `parameter`.
      parameterResults: { include: { testParameter: { include: { parameter: true } } } },
      signatories: { select: { signatoryId: true } },
    },
  },
} satisfies Prisma.ReportInclude;

type ReportPatient = Pick<
  Patient,
  "id" | "patientId" | "firstName" | "lastName" | "mobile" | "gender" | "dob" | "organizationId"
>;
type ReportAppointment = Appointment & {
  patient: ReportPatient;
  bill: Pick<Bill, "billNo"> | null;
  tests: Pick<AppointmentTest, "testId" | "testName">[];
};
type ReportTestResultSummaryRow = Pick<
  ReportTestResult,
  "id" | "testId" | "status" | "sampleId"
> & {
  test: Pick<Test, "name" | "shortName">;
  sample: Pick<Sample, "sampleNo" | "status" | "collectedAt" | "receivedAt"> | null;
};
export type ReportWithListRelations = Report & {
  appointment: ReportAppointment;
  results: ReportTestResultSummaryRow[];
  /** Filtered to `action: "DOWNLOADED"` only — see `withListRelations`. */
  auditLogs: { id: string }[];
};
export type ReportWithDetailRelations = Omit<ReportWithListRelations, "results"> & {
  results: (ReportTestResult & {
    test: Pick<Test, "name" | "shortName"> & {
      department: Pick<Department, "name"> | null;
      appCategory: { name: string } | null;
    };
    sample: Pick<Sample, "sampleNo" | "status" | "collectedAt" | "receivedAt"> | null;
    parameterResults: (ReportParameterResult & {
      testParameter: TestParameter & { parameter: Parameter };
    })[];
    signatories: { signatoryId: string }[];
  })[];
};

export function toReportListItem(report: ReportWithListRelations): ReportListItem {
  const { appointment } = report;
  const { patient } = appointment;

  return {
    id: report.id,
    reportNo: report.reportNo,
    appointmentId: appointment.id,
    appointmentNo: appointment.appointmentNo,
    billNo: appointment.bill?.billNo ?? null,
    patient: {
      id: patient.id,
      patientId: patient.patientId,
      fullName: `${patient.firstName} ${patient.lastName}`.trim(),
      mobile: patient.mobile,
      gender: fromDbGender(patient.gender),
      age: computeAge(patient.dob),
    },
    status: report.status as ReportStatus,
    isEmergency: report.isEmergency,
    tests: appointment.tests.map((t) => ({ testId: t.testId, testName: t.testName })),
    testResults: report.results.map((r): ReportTestResultSummary => ({
      resultId: r.id,
      testId: r.testId,
      testName: r.test.name,
      testShortName: r.test.shortName,
      status: r.status as ReportTestResultSummary["status"],
      sampleId: r.sampleId,
      sampleStatus: r.sample?.status ?? null,
      sampleNo: r.sample?.sampleNo ?? null,
    })),
    enteredByUserId: report.enteredByUserId,
    enteredAt: report.enteredAt ? report.enteredAt.toISOString() : null,
    approvedByUserId: report.approvedByUserId,
    approvedAt: report.approvedAt ? report.approvedAt.toISOString() : null,
    submittedAt: report.submittedAt ? report.submittedAt.toISOString() : null,
    printCount: report.printCount,
    lastPrintedAt: report.lastPrintedAt ? report.lastPrintedAt.toISOString() : null,
    cancelReason: report.cancelReason,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

function toReportParameterResultLine(
  result: ReportWithDetailRelations["results"][number]["parameterResults"][number],
): ReportParameterResultLine {
  return {
    id: result.id,
    parameterId: result.testParameterId,
    name: result.testParameter.parameter.name,
    shortCode: result.testParameter.parameter.shortName,
    unit: result.testParameter.unit,
    referenceRangeText: result.testParameter.referenceRangeText,
    resultValue: result.resultValue,
    machineValue: result.machineValue,
    flag: result.flag as ReportParameterResultLine["flag"],
    highlight: result.highlight,
  };
}

function toReportResultLine(
  result: ReportWithDetailRelations["results"][number],
): ReportResultLine {
  return {
    id: result.id,
    appointmentTestId: result.appointmentTestId,
    testId: result.testId,
    testName: result.test.name,
    testShortName: result.test.shortName,
    // A Test categorised only by CMS category (the admin form's default since
    // department became optional) still needs a grouping label, and a blank
    // one would collapse every such test into an unnamed section on the PDF.
    departmentName: result.test.department?.name ?? result.test.appCategory?.name ?? "General",
    sampleId: result.sampleId,
    sampleNo: result.sample?.sampleNo ?? null,
    sampleStatus: result.sample?.status ?? null,
    resultValue: result.resultValue,
    unit: result.unit,
    referenceRange: result.referenceRange,
    method: result.method,
    remarks: result.remarks,
    flag: result.flag as ReportResultLine["flag"],
    isCritical: result.isCritical,
    enteredByUserId: result.enteredByUserId,
    enteredAt: result.enteredAt ? result.enteredAt.toISOString() : null,
    status: result.status as ReportResultLine["status"],
    submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
    approvedByUserId: result.approvedByUserId,
    approvedAt: result.approvedAt ? result.approvedAt.toISOString() : null,
    rejectedAt: result.rejectedAt ? result.rejectedAt.toISOString() : null,
    rejectReason: result.rejectReason,
    printedAt: result.printedAt ? result.printedAt.toISOString() : null,
    signatoryIds: result.signatories.map((s) => s.signatoryId),
    parameters: result.parameterResults
      .slice()
      .sort((a, b) => a.testParameter.sortOrder - b.testParameter.sortOrder)
      .map(toReportParameterResultLine),
  };
}

export function toReportDetails(report: ReportWithDetailRelations): ReportDetails {
  return {
    ...toReportListItem(report),
    results: report.results.map(toReportResultLine),
  };
}

export interface ListReportsFilter {
  view?: ReportViewStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
  organizationId?: string;
  skip: number;
  take: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

const SORTABLE_FIELDS = new Set(["createdAt", "reportNo", "status", "submittedAt", "approvedAt"]);

export function buildBaseWhere(
  filter: Pick<
    ListReportsFilter,
    "search" | "dateFrom" | "dateTo" | "isEmergency" | "organizationId"
  >,
): Prisma.ReportWhereInput {
  const where: Prisma.ReportWhereInput = {};
  const appointmentFilter: Prisma.AppointmentWhereInput = {};

  if (filter.organizationId) {
    appointmentFilter.patient = { is: { organizationId: filter.organizationId } };
  }
  if (filter.search) {
    where.OR = [
      { reportNo: { contains: filter.search, mode: "insensitive" } },
      { appointment: { is: { appointmentNo: { contains: filter.search, mode: "insensitive" } } } },
      {
        appointment: {
          is: { bill: { is: { billNo: { contains: filter.search, mode: "insensitive" } } } },
        },
      },
      {
        appointment: {
          is: { patient: { patientId: { contains: filter.search, mode: "insensitive" } } },
        },
      },
      {
        appointment: {
          is: { patient: { firstName: { contains: filter.search, mode: "insensitive" } } },
        },
      },
      {
        appointment: {
          is: { patient: { lastName: { contains: filter.search, mode: "insensitive" } } },
        },
      },
      { appointment: { is: { patient: { mobile: { contains: filter.search } } } } },
      {
        results: {
          some: { sample: { is: { sampleNo: { contains: filter.search, mode: "insensitive" } } } },
        },
      },
    ];
  }
  if (filter.dateFrom || filter.dateTo) {
    where.createdAt = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }
  if (filter.isEmergency !== undefined) {
    where.isEmergency = filter.isEmergency;
  }
  if (Object.keys(appointmentFilter).length > 0) {
    where.appointment = { is: appointmentFilter };
  }

  return where;
}

const VIEW_TO_STATUS: Record<Exclude<ReportViewStatus, "all">, DbReportStatus> = {
  pending: "PENDING",
  received: "RECEIVED",
  processing: "PROCESSING",
  partial: "PARTIAL",
  approved: "APPROVED",
  submitted: "SUBMITTED",
  printed: "PRINTED",
  cancelled: "CANCELLED",
};

function applyViewFilter(
  where: Prisma.ReportWhereInput,
  view: ReportViewStatus | undefined,
): Prisma.ReportWhereInput {
  if (!view || view === "all") return where;
  return { ...where, status: VIEW_TO_STATUS[view] };
}

export async function listReports(
  filter: ListReportsFilter,
): Promise<{ rows: ReportWithListRelations[]; total: number }> {
  const baseWhere = buildBaseWhere(filter);
  const where = applyViewFilter(baseWhere, filter.view);
  const orderBy: Prisma.ReportOrderByWithRelationInput = SORTABLE_FIELDS.has(filter.sortBy)
    ? { [filter.sortBy]: filter.sortDir }
    : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: withListRelations,
      orderBy,
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.report.count({ where }),
  ]);

  return { rows: rows as ReportWithListRelations[], total };
}

/** Reports Delivery Tracker's data source — unlike `listReports`, this
 *  fetches every matching row (no skip/take pagination) so the tracker
 *  service can compute stats/SLA-breach/status filters over the FULL
 *  filtered set before paginating in memory. Capped at 2000 rows: a
 *  disclosed scale limit for this internal ops view, not a silent one. */
export async function findAllForTracker(
  filter: Pick<ListReportsFilter, "search" | "dateFrom" | "dateTo" | "isEmergency">,
): Promise<ReportWithListRelations[]> {
  const rows = await prisma.report.findMany({
    where: buildBaseWhere(filter),
    include: withListRelations,
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return rows as ReportWithListRelations[];
}

export async function countReportsByView(
  filter: Pick<
    ListReportsFilter,
    "search" | "dateFrom" | "dateTo" | "isEmergency" | "organizationId"
  >,
): Promise<ReportViewCounts> {
  const baseWhere = buildBaseWhere(filter);
  const views: Exclude<ReportViewStatus, "all">[] = [
    "pending",
    "received",
    "processing",
    "partial",
    "approved",
    "submitted",
    "printed",
    "cancelled",
  ];

  const [all, ...rest] = await Promise.all([
    prisma.report.count({ where: baseWhere }),
    ...views.map((view) => prisma.report.count({ where: applyViewFilter(baseWhere, view) })),
  ]);

  return {
    all,
    pending: rest[0],
    received: rest[1],
    processing: rest[2],
    partial: rest[3],
    approved: rest[4],
    submitted: rest[5],
    printed: rest[6],
    cancelled: rest[7],
  };
}

export function findReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: withDetailRelations,
  }) as Promise<ReportWithDetailRelations | null>;
}

export function findReportByAppointmentId(appointmentId: string) {
  return prisma.report.findUnique({
    where: { appointmentId },
    include: withDetailRelations,
  }) as Promise<ReportWithDetailRelations | null>;
}

/** Idempotent: no-ops if a Report already exists for this appointment.
 *  Creates the Report (PENDING) with every ReportTestResult row
 *  pre-scaffolded (empty) for the appointment's ordered tests, so Report
 *  Entry only ever reads, never materializes rows on the fly. Must run
 *  *after* `sampleRepository.ensureSamplesForAppointment` in the same
 *  transaction (see `labWorkflow.service.ts`) so each result row can already
 *  be linked to the Sample covering its test — that link is what lets
 *  `submitReport` block on samples that aren't RECEIVED yet. */
export async function ensureReportForAppointment(
  appointmentId: string,
  tx: Prisma.TransactionClient,
): Promise<Report | null> {
  const existing = await tx.report.findUnique({ where: { appointmentId } });
  if (existing) return null;

  const appointment = await tx.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
  const appointmentTests = await tx.appointmentTest.findMany({ where: { appointmentId } });
  if (appointmentTests.length === 0) return null;

  const sampleTests = await tx.sampleTest.findMany({
    where: { appointmentTestId: { in: appointmentTests.map((at) => at.id) } },
  });
  const sampleIdByAppointmentTestId = new Map(
    sampleTests.map((st) => [st.appointmentTestId, st.sampleId]),
  );

  const reportNo = await nextReportNo(tx);
  const report = await tx.report.create({
    data: {
      reportNo,
      appointmentId,
      isEmergency: appointment.isEmergency,
      results: {
        create: appointmentTests.map((at) => ({
          appointmentTestId: at.id,
          testId: at.testId,
          sampleId: sampleIdByAppointmentTestId.get(at.id) ?? null,
        })),
      },
    },
  });

  await tx.reportAuditLog.create({
    data: { reportId: report.id, action: "CREATED", note: "Auto-created after bill payment" },
  });

  return report;
}

export function listAuditLogsForReport(reportId: string) {
  return prisma.reportAuditLog.findMany({ where: { reportId }, orderBy: { createdAt: "desc" } });
}

export function createAuditLog(
  reportId: string,
  action: string,
  performedByUserId: string | null | undefined,
  note: string | undefined,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.reportAuditLog.create({ data: { reportId, action, performedByUserId, note } });
}
