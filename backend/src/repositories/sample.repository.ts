import type {
  Appointment,
  AppointmentTest,
  Container,
  Patient,
  Prisma,
  Sample,
  SampleStatus as DbSampleStatus,
  SampleTest,
  SampleType,
  Test,
} from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { computeAge } from "./patient.repository";
import { fromDbGender } from "../utils/enumMappers";
import { nextSampleNo } from "../utils/idGenerator";
import type {
  SampleRecord,
  SampleStatus,
  SampleViewCounts,
  SampleViewStatus,
} from "../types/sample.types";

const withRelations = {
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
      bill: { select: { status: true } },
    },
  },
  sampleType: { select: { name: true } },
  container: { select: { name: true, color: true } },
  tests: { include: { test: { select: { name: true, shortName: true } } } },
} satisfies Prisma.SampleInclude;

type SamplePatient = Pick<
  Patient,
  "id" | "patientId" | "firstName" | "lastName" | "mobile" | "gender" | "dob" | "organizationId"
>;
type SampleAppointment = Appointment & { patient: SamplePatient; bill: { status: string } | null };
type SampleTestWithTest = SampleTest & { test: Pick<Test, "name" | "shortName"> };
export type SampleWithRelations = Sample & {
  appointment: SampleAppointment;
  sampleType: Pick<SampleType, "name">;
  container: Pick<Container, "name" | "color"> | null;
  tests: SampleTestWithTest[];
};

/** Maps a Prisma row (with appointment/patient/sampleType/container/tests
 *  loaded) to the API shape. `collectedBy`/`receivedBy`/`rejectedBy` display
 *  names are resolved separately by the service layer via the shared
 *  `resolveUserNames` batched lookup — these columns have no Prisma relation
 *  to `User`, same reasoning as `Bill.createdByUserId`. */
export function toSampleRecord(sample: SampleWithRelations): SampleRecord {
  const { appointment } = sample;
  const { patient } = appointment;

  return {
    id: sample.id,
    sampleNo: sample.sampleNo,
    appointmentId: appointment.id,
    appointmentNo: appointment.appointmentNo,
    patient: {
      id: patient.id,
      patientId: patient.patientId,
      fullName: `${patient.firstName} ${patient.lastName}`.trim(),
      mobile: patient.mobile,
      gender: fromDbGender(patient.gender),
      age: computeAge(patient.dob),
    },
    sampleTypeId: sample.sampleTypeId,
    sampleType: sample.sampleType.name,
    containerId: sample.containerId,
    containerName: sample.container?.name ?? null,
    containerColor: sample.container?.color ?? null,
    status: sample.status as SampleStatus,
    isEmergency: sample.isEmergency,
    tests: sample.tests.map((t) => ({
      testId: t.testId,
      testName: t.test.name,
      testShortName: t.test.shortName,
    })),
    collectedAt: sample.collectedAt ? sample.collectedAt.toISOString() : null,
    collectedByUserId: sample.collectedByUserId,
    receivedAt: sample.receivedAt ? sample.receivedAt.toISOString() : null,
    receivedByUserId: sample.receivedByUserId,
    approvedAt: sample.approvedAt ? sample.approvedAt.toISOString() : null,
    approvedByUserId: sample.approvedByUserId,
    rejectedAt: sample.rejectedAt ? sample.rejectedAt.toISOString() : null,
    rejectedByUserId: sample.rejectedByUserId,
    rejectionReason: sample.rejectionReason,
    createdAt: sample.createdAt.toISOString(),
    updatedAt: sample.updatedAt.toISOString(),
  };
}

export interface ListSamplesFilter {
  view?: SampleViewStatus;
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

const SORTABLE_FIELDS = new Set(["createdAt", "sampleNo", "status", "collectedAt", "receivedAt"]);

function buildBaseWhere(
  filter: Pick<
    ListSamplesFilter,
    "search" | "dateFrom" | "dateTo" | "isEmergency" | "organizationId"
  >,
): Prisma.SampleWhereInput {
  const where: Prisma.SampleWhereInput = {};
  const appointmentFilter: Prisma.AppointmentWhereInput = {};

  if (filter.organizationId) {
    appointmentFilter.patient = { is: { organizationId: filter.organizationId } };
  }
  if (filter.search) {
    where.OR = [
      { sampleNo: { contains: filter.search, mode: "insensitive" } },
      { appointment: { is: { appointmentNo: { contains: filter.search, mode: "insensitive" } } } },
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

const VIEW_TO_STATUS: Record<Exclude<SampleViewStatus, "all">, DbSampleStatus> = {
  pending: "PENDING",
  collected: "COLLECTED",
  received: "RECEIVED",
  approved: "APPROVED",
  rejected: "REJECTED",
  completed: "COMPLETED",
};

function applyViewFilter(
  where: Prisma.SampleWhereInput,
  view: SampleViewStatus | undefined,
): Prisma.SampleWhereInput {
  if (!view || view === "all") return where;
  return { ...where, status: VIEW_TO_STATUS[view] };
}

export async function listSamples(
  filter: ListSamplesFilter,
): Promise<{ rows: SampleWithRelations[]; total: number }> {
  const baseWhere = buildBaseWhere(filter);
  const where = applyViewFilter(baseWhere, filter.view);
  const orderBy: Prisma.SampleOrderByWithRelationInput = SORTABLE_FIELDS.has(filter.sortBy)
    ? { [filter.sortBy]: filter.sortDir }
    : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.sample.findMany({
      where,
      include: withRelations,
      orderBy,
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.sample.count({ where }),
  ]);

  return { rows: rows as SampleWithRelations[], total };
}

/** Powers the Pending/Collected/Received/Rejected/Completed/All tab badge
 *  counts — same filters as the active list query minus `view` itself. */
export async function countSamplesByView(
  filter: Pick<
    ListSamplesFilter,
    "search" | "dateFrom" | "dateTo" | "isEmergency" | "organizationId"
  >,
): Promise<SampleViewCounts> {
  const baseWhere = buildBaseWhere(filter);
  const [all, pending, collected, received, approved, rejected, completed] = await Promise.all([
    prisma.sample.count({ where: baseWhere }),
    prisma.sample.count({ where: applyViewFilter(baseWhere, "pending") }),
    prisma.sample.count({ where: applyViewFilter(baseWhere, "collected") }),
    prisma.sample.count({ where: applyViewFilter(baseWhere, "received") }),
    prisma.sample.count({ where: applyViewFilter(baseWhere, "approved") }),
    prisma.sample.count({ where: applyViewFilter(baseWhere, "rejected") }),
    prisma.sample.count({ where: applyViewFilter(baseWhere, "completed") }),
  ]);

  return { all, pending, collected, received, approved, rejected, completed };
}

export function findSampleById(id: string) {
  return prisma.sample.findUnique({
    where: { id },
    include: withRelations,
  }) as Promise<SampleWithRelations | null>;
}

export function findSamplesByAppointmentId(appointmentId: string) {
  return prisma.sample.findMany({
    where: { appointmentId },
    include: withRelations,
    orderBy: { createdAt: "asc" },
  }) as Promise<SampleWithRelations[]>;
}

export function listStatusLogsForSample(sampleId: string) {
  return prisma.sampleStatusLog.findMany({ where: { sampleId }, orderBy: { createdAt: "desc" } });
}

/** Idempotent: no-ops if any Sample already exists for this appointment.
 *  Groups the appointment's ordered tests by SampleType — tests sharing a
 *  SampleType share one Sample row (enforced by the `(appointmentId,
 *  sampleTypeId)` unique index); different SampleTypes always get different
 *  Sample rows. `containerId` is snapshotted from that group's
 *  TestSampleRule (first configured one found) at creation time. */
export async function ensureSamplesForAppointment(
  appointmentId: string,
  tx: Prisma.TransactionClient,
): Promise<Sample[]> {
  const existing = await tx.sample.findFirst({ where: { appointmentId } });
  if (existing) return [];

  const appointment = await tx.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
  const appointmentTests = await tx.appointmentTest.findMany({
    where: { appointmentId },
    include: { test: { include: { sampleRule: true } } },
  });

  const groups = new Map<
    string,
    (AppointmentTest & { test: Test & { sampleRule: { containerId: string | null } | null } })[]
  >();
  for (const at of appointmentTests) {
    const key = at.test.sampleTypeId;
    const group = groups.get(key) ?? [];
    group.push(at);
    groups.set(key, group);
  }

  const created: Sample[] = [];
  for (const [sampleTypeId, group] of groups) {
    const containerId =
      group.find((at) => at.test.sampleRule?.containerId)?.test.sampleRule?.containerId ?? null;
    const sampleNo = await nextSampleNo(sampleTypeId, tx);

    const sample = await tx.sample.create({
      data: {
        sampleNo,
        appointmentId,
        sampleTypeId,
        containerId,
        isEmergency: appointment.isEmergency,
        tests: { create: group.map((at) => ({ appointmentTestId: at.id, testId: at.testId })) },
      },
    });

    await tx.sampleStatusLog.create({
      data: {
        sampleId: sample.id,
        fromStatus: null,
        toStatus: "PENDING",
        note: "Auto-created after bill payment",
      },
    });

    created.push(sample);
  }

  return created;
}

/** Atomic status transition guarded by the current status: the `updateMany`
 *  WHERE clause only matches (and only then applies) if the row is still in
 *  one of `allowedFromStatuses` at the moment of the write, so a concurrent
 *  double-click / duplicate request loses the race safely (`count === 0`)
 *  instead of double-applying. */
export async function transitionSample(params: {
  id: string;
  allowedFromStatuses: SampleStatus[];
  toStatus: SampleStatus;
  data: Prisma.SampleUpdateInput;
  performedByUserId?: string | null;
  note?: string;
  tx: Prisma.TransactionClient;
}): Promise<SampleWithRelations> {
  const { id, allowedFromStatuses, toStatus, data, performedByUserId, note, tx } = params;

  const before = await tx.sample.findUnique({ where: { id } });
  if (!before) {
    throw ApiError.notFound("Sample not found");
  }

  const result = await tx.sample.updateMany({
    where: { id, status: { in: allowedFromStatuses as DbSampleStatus[] } },
    data,
  });
  if (result.count === 0) {
    throw ApiError.conflict(
      `Sample is currently ${before.status} and cannot be moved to ${toStatus}`,
    );
  }

  await tx.sampleStatusLog.create({
    data: {
      sampleId: id,
      fromStatus: before.status,
      toStatus,
      performedByUserId: performedByUserId ?? null,
      note,
    },
  });

  return tx.sample.findUniqueOrThrow({
    where: { id },
    include: withRelations,
  }) as Promise<SampleWithRelations>;
}

/** True once every Sample for the appointment has reached COLLECTED or a
 *  later status — used to roll `Appointment.status` forward to
 *  SAMPLE_COLLECTED. */
export async function areAllSamplesCollectedForAppointment(
  appointmentId: string,
  tx: Prisma.TransactionClient,
): Promise<boolean> {
  const pendingCount = await tx.sample.count({ where: { appointmentId, status: "PENDING" } });
  return pendingCount === 0;
}
