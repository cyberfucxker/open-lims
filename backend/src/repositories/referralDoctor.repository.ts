import type { Prisma, ReferralDoctor } from "@prisma/client";
import { prisma } from "../config/database";
import type { ReferralDoctorDto } from "../types/referralDoctor.types";

type ReferralDoctorWithStaff = ReferralDoctor & {
  marketingStaff: { name: string } | null;
};

const referralDoctorInclude = {
  marketingStaff: { select: { name: true } },
} satisfies Prisma.ReferralDoctorInclude;

export interface ListReferralDoctorsFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  marketingStaffId?: string;
  unassignedOnly?: boolean;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface ReferralDoctorWriteInput {
  doctorName: string;
  hospitalName?: string | null;
  speciality?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  remarks?: string | null;
  marketingStaffId?: string | null;
  status?: boolean;
}

const SORTABLE_FIELDS = new Set([
  "doctorName",
  "hospitalName",
  "speciality",
  "city",
  "status",
  "createdAt",
  "updatedAt",
]);

export function toReferralDoctorDto(doctor: ReferralDoctorWithStaff): ReferralDoctorDto {
  return {
    id: doctor.id,
    doctorName: doctor.doctorName,
    hospitalName: doctor.hospitalName,
    speciality: doctor.speciality,
    mobile: doctor.mobile,
    email: doctor.email,
    city: doctor.city,
    address: doctor.address,
    remarks: doctor.remarks,
    marketingStaffId: doctor.marketingStaffId,
    marketingStaffName: doctor.marketingStaff?.name ?? null,
    status: doctor.status,
    deletedAt: doctor.deletedAt ? doctor.deletedAt.toISOString() : null,
    createdAt: doctor.createdAt.toISOString(),
    updatedAt: doctor.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListReferralDoctorsFilter,
    "search" | "active" | "includeDeleted" | "marketingStaffId" | "unassignedOnly"
  >,
): Prisma.ReferralDoctorWhereInput {
  const where: Prisma.ReferralDoctorWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.search) {
    where.OR = [
      { doctorName: { contains: filter.search, mode: "insensitive" } },
      { hospitalName: { contains: filter.search, mode: "insensitive" } },
      { speciality: { contains: filter.search, mode: "insensitive" } },
      { city: { contains: filter.search, mode: "insensitive" } },
      { mobile: { contains: filter.search } },
    ];
  }
  if (filter.unassignedOnly) {
    where.marketingStaffId = null;
  } else if (filter.marketingStaffId) {
    where.marketingStaffId = filter.marketingStaffId;
  }
  if (filter.active === "true") {
    where.status = true;
  } else if (filter.active === "false") {
    where.status = false;
  }

  return where;
}

function buildOrderBy(
  sortBy?: string,
  sortDir?: string,
): Prisma.ReferralDoctorOrderByWithRelationInput {
  const direction = sortDir === "asc" ? "asc" : "desc";
  if (sortBy === "marketingStaff") {
    return { marketingStaff: { name: direction } };
  }
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: direction };
}

export async function listReferralDoctors(
  filter: ListReferralDoctorsFilter,
): Promise<{ rows: ReferralDoctorWithStaff[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.referralDoctor.findMany({
      where,
      include: referralDoctorInclude,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.referralDoctor.count({ where }),
  ]);

  return { rows, total };
}

/** Unpaged, active-only list — used to populate the Referring Doctor picker
 *  on Patient Registration. */
export function listActiveReferralDoctors() {
  return prisma.referralDoctor.findMany({
    where: { deletedAt: null, status: true },
    include: referralDoctorInclude,
    orderBy: { doctorName: "asc" },
  });
}

export function findReferralDoctorById(id: string) {
  return prisma.referralDoctor.findFirst({
    where: { id, deletedAt: null },
    include: referralDoctorInclude,
  });
}

export function findReferralDoctorsByIds(ids: string[]) {
  return prisma.referralDoctor.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: referralDoctorInclude,
  });
}

export function createReferralDoctor(data: ReferralDoctorWriteInput) {
  return prisma.referralDoctor.create({
    data: { ...data, status: data.status ?? true },
    include: referralDoctorInclude,
  });
}

export function updateReferralDoctor(id: string, data: ReferralDoctorWriteInput) {
  return prisma.referralDoctor.update({
    where: { id },
    data,
    include: referralDoctorInclude,
  });
}

export function softDeleteReferralDoctor(id: string) {
  return prisma.referralDoctor.update({
    where: { id },
    data: { deletedAt: new Date(), status: false },
    include: referralDoctorInclude,
  });
}

export function restoreReferralDoctor(id: string) {
  return prisma.referralDoctor.update({
    where: { id },
    data: { deletedAt: null },
    include: referralDoctorInclude,
  });
}

export function setReferralDoctorStatus(id: string, status: boolean) {
  return prisma.referralDoctor.update({
    where: { id },
    data: { status },
    include: referralDoctorInclude,
  });
}

export function assignReferralDoctor(id: string, marketingStaffId: string) {
  return prisma.referralDoctor.update({
    where: { id },
    data: { marketingStaffId },
    include: referralDoctorInclude,
  });
}

export async function bulkAssignReferralDoctors(doctorIds: string[], marketingStaffId: string) {
  await prisma.referralDoctor.updateMany({
    where: { id: { in: doctorIds } },
    data: { marketingStaffId },
  });
  return findReferralDoctorsByIds(doctorIds);
}

export function createAuditLog(
  referralDoctorId: string,
  action: string,
  performedByUserId?: string | null,
  note?: string | null,
) {
  return prisma.referralDoctorAuditLog.create({
    data: { referralDoctorId, action, performedByUserId, note },
  });
}

export function listAuditLogs(referralDoctorId: string) {
  return prisma.referralDoctorAuditLog.findMany({
    where: { referralDoctorId },
    orderBy: { createdAt: "desc" },
  });
}
