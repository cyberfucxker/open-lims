import type { MarketingStaff, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { MarketingStaffDto } from "../types/marketingStaff.types";

type MarketingStaffWithCount = MarketingStaff & {
  _count: { referralDoctors: number };
};

const marketingStaffInclude = {
  _count: { select: { referralDoctors: { where: { deletedAt: null } } } },
} satisfies Prisma.MarketingStaffInclude;

export interface ListMarketingStaffFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface MarketingStaffWriteInput {
  employeeCode: string;
  name: string;
  mobile: string;
  email?: string | null;
  designation?: string | null;
  branchId?: string | null;
  joiningDate: string;
  status?: boolean;
}

/** Builds the Prisma write payload from an explicit field whitelist. */
function toPrismaData(data: MarketingStaffWriteInput) {
  return {
    employeeCode: data.employeeCode,
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    designation: data.designation,
    branchId: data.branchId,
    joiningDate: new Date(data.joiningDate),
  };
}

const SORTABLE_FIELDS = new Set([
  "employeeCode",
  "name",
  "mobile",
  "joiningDate",
  "status",
  "createdAt",
  "updatedAt",
]);

export function toMarketingStaffDto(staff: MarketingStaffWithCount): MarketingStaffDto {
  return {
    id: staff.id,
    employeeCode: staff.employeeCode,
    name: staff.name,
    mobile: staff.mobile,
    email: staff.email,
    designation: staff.designation,
    branchId: staff.branchId,
    joiningDate: staff.joiningDate.toISOString(),
    referralDoctorCount: staff._count.referralDoctors,
    status: staff.status,
    deletedAt: staff.deletedAt ? staff.deletedAt.toISOString() : null,
    createdAt: staff.createdAt.toISOString(),
    updatedAt: staff.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListMarketingStaffFilter, "search" | "active" | "includeDeleted">,
): Prisma.MarketingStaffWhereInput {
  const where: Prisma.MarketingStaffWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { employeeCode: { contains: filter.search, mode: "insensitive" } },
      { mobile: { contains: filter.search } },
      { email: { contains: filter.search, mode: "insensitive" } },
    ];
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
): Prisma.MarketingStaffOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listMarketingStaff(
  filter: ListMarketingStaffFilter,
): Promise<{ rows: MarketingStaffWithCount[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.marketingStaff.findMany({
      where,
      include: marketingStaffInclude,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.marketingStaff.count({ where }),
  ]);

  return { rows, total };
}

/** Unpaged, active-only list — used to populate staff pickers/dropdowns. */
export function listActiveMarketingStaff() {
  return prisma.marketingStaff.findMany({
    where: { deletedAt: null, status: true },
    include: marketingStaffInclude,
    orderBy: { name: "asc" },
  });
}

export function findMarketingStaffById(id: string) {
  return prisma.marketingStaff.findFirst({
    where: { id, deletedAt: null },
    include: marketingStaffInclude,
  });
}

export function createMarketingStaff(data: MarketingStaffWriteInput) {
  return prisma.marketingStaff.create({
    data: { ...toPrismaData(data), status: data.status ?? true },
    include: marketingStaffInclude,
  });
}

export function updateMarketingStaff(id: string, data: MarketingStaffWriteInput) {
  return prisma.marketingStaff.update({
    where: { id },
    data: toPrismaData(data),
    include: marketingStaffInclude,
  });
}

export function softDeleteMarketingStaff(id: string) {
  return prisma.marketingStaff.update({
    where: { id },
    data: { deletedAt: new Date(), status: false },
    include: marketingStaffInclude,
  });
}

export function restoreMarketingStaff(id: string) {
  return prisma.marketingStaff.update({
    where: { id },
    data: { deletedAt: null },
    include: marketingStaffInclude,
  });
}

export function setMarketingStaffStatus(id: string, status: boolean) {
  return prisma.marketingStaff.update({
    where: { id },
    data: { status },
    include: marketingStaffInclude,
  });
}

export function createAuditLog(
  marketingStaffId: string,
  action: string,
  performedByUserId?: string | null,
  note?: string | null,
) {
  return prisma.marketingStaffAuditLog.create({
    data: { marketingStaffId, action, performedByUserId, note },
  });
}

export function listAuditLogs(marketingStaffId: string) {
  return prisma.marketingStaffAuditLog.findMany({
    where: { marketingStaffId },
    orderBy: { createdAt: "desc" },
  });
}
