import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { PrescriptionDto, PrescriptionStatus } from "../types/prescription.types";

const PRESCRIPTION_INCLUDE = {
  appUser: { select: { id: true, name: true, mobile: true } },
  familyMember: { select: { relation: true, patient: true } },
  city: { select: { id: true, name: true } },
} satisfies Prisma.PrescriptionInclude;

type PrescriptionRow = Prisma.PrescriptionGetPayload<{ include: typeof PRESCRIPTION_INCLUDE }>;

export interface ListPrescriptionsFilter {
  search?: string;
  status?: string;
  cityId?: string;
  skip: number;
  take: number;
}

const PRESCRIPTION_STATUSES = new Set<PrescriptionStatus>(["SUBMITTED", "APPROVED", "REJECTED"]);

function relationLabel(relation: string): string {
  return relation.charAt(0) + relation.slice(1).toLowerCase();
}

/** Maps a Prisma row to the exact shape the Superadmin table expects. */
export function toPrescriptionDto(row: PrescriptionRow): PrescriptionDto {
  const patient = row.familyMember?.patient;
  return {
    id: row.id,
    patientName: patient ? `${patient.firstName} ${patient.lastName}`.trim() : null,
    patientMobile: patient?.mobile ?? null,
    relation: row.familyMember ? relationLabel(row.familyMember.relation) : null,
    customerId: row.appUser.id,
    customerName: row.appUser.name ?? row.appUser.mobile,
    customerMobile: row.appUser.mobile,
    cityId: row.city?.id ?? null,
    cityName: row.city?.name ?? null,
    query: row.query,
    fileUrl: row.fileUrl,
    status: row.status,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Soft-deleted rows are a patient withdrawing their own upload — never shown
 *  to an admin, same as they disappear from the patient's own list. */
function buildWhere(
  filter: Pick<ListPrescriptionsFilter, "search" | "status" | "cityId">,
): Prisma.PrescriptionWhereInput {
  const where: Prisma.PrescriptionWhereInput = { deletedAt: null };

  if (filter.search) {
    const contains = { contains: filter.search, mode: "insensitive" as const };
    where.OR = [
      { appUser: { name: contains } },
      { appUser: { mobile: contains } },
      { familyMember: { patient: { firstName: contains } } },
      { familyMember: { patient: { lastName: contains } } },
      { familyMember: { patient: { mobile: contains } } },
      { query: contains },
    ];
  }
  if (filter.status && PRESCRIPTION_STATUSES.has(filter.status as PrescriptionStatus)) {
    where.status = filter.status as PrescriptionStatus;
  }
  if (filter.cityId) {
    where.cityId = filter.cityId;
  }

  return where;
}

export async function listPrescriptions(
  filter: ListPrescriptionsFilter,
): Promise<{ rows: PrescriptionRow[]; total: number; statusCounts: Record<string, number> }> {
  const where = buildWhere(filter);
  // Counts ignore the status filter on purpose — a tab row that only ever
  // reports the tab you're standing on tells you nothing about the queue.
  const countsWhere = buildWhere({ search: filter.search, cityId: filter.cityId });

  const [rows, total, grouped] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: PRESCRIPTION_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.prescription.count({ where }),
    prisma.prescription.groupBy({ by: ["status"], where: countsWhere, _count: { _all: true } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const group of grouped) statusCounts[group.status] = group._count._all;

  return { rows, total, statusCounts };
}

export function findPrescriptionById(id: string) {
  return prisma.prescription.findFirst({
    where: { id, deletedAt: null },
    include: PRESCRIPTION_INCLUDE,
  });
}

export function updatePrescriptionStatus(
  id: string,
  status: PrescriptionStatus,
  rejectionReason: string | null,
) {
  return prisma.prescription.update({
    where: { id },
    data: { status, rejectionReason },
    include: PRESCRIPTION_INCLUDE,
  });
}
