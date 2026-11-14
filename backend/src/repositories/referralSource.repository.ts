import type { Prisma, ReferralSource } from "@prisma/client";
import { prisma } from "../config/database";
import type { ReferralSourceDto, ReferralType } from "../types/referralSource.types";

type ReferralSourceWithRelations = ReferralSource & {
  organization: { name: string } | null;
  marketingStaff: { name: string } | null;
  assignedPriceList: { name: string } | null;
};

const referralSourceInclude = {
  organization: { select: { name: true } },
  marketingStaff: { select: { name: true } },
  assignedPriceList: { select: { name: true } },
} satisfies Prisma.ReferralSourceInclude;

export interface ListReferralSourcesFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  referralType?: ReferralType;
  marketingStaffId?: string;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface ReferralSourceWriteInput {
  referralType: ReferralType;
  name: string;
  organizationId?: string | null;
  mobile: string;
  email?: string | null;
  speciality?: string | null;
  address?: string | null;
  city?: string | null;
  marketingStaffId?: string | null;
  commissionPercentage?: number;
  status?: boolean;
  notes?: string | null;
}

const SORTABLE_FIELDS = new Set([
  "name",
  "referralCode",
  "referralType",
  "city",
  "status",
  "createdAt",
  "updatedAt",
]);

export function toReferralSourceDto(source: ReferralSourceWithRelations): ReferralSourceDto {
  return {
    id: source.id,
    referralCode: source.referralCode,
    referralType: source.referralType as ReferralType,
    name: source.name,
    organizationId: source.organizationId,
    organizationName: source.organization?.name ?? null,
    mobile: source.mobile,
    email: source.email,
    speciality: source.speciality,
    address: source.address,
    city: source.city,
    marketingStaffId: source.marketingStaffId,
    marketingStaffName: source.marketingStaff?.name ?? null,
    assignedPriceListId: source.assignedPriceListId,
    assignedPriceListName: source.assignedPriceList?.name ?? null,
    commissionPercentage: Number(source.commissionPercentage),
    status: source.status,
    notes: source.notes,
    deletedAt: source.deletedAt ? source.deletedAt.toISOString() : null,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListReferralSourcesFilter,
    "search" | "active" | "includeDeleted" | "referralType" | "marketingStaffId"
  >,
): Prisma.ReferralSourceWhereInput {
  const where: Prisma.ReferralSourceWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { referralCode: { contains: filter.search, mode: "insensitive" } },
      { mobile: { contains: filter.search } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { city: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.referralType) {
    where.referralType = filter.referralType;
  }
  if (filter.marketingStaffId) {
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
): Prisma.ReferralSourceOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listReferralSources(
  filter: ListReferralSourcesFilter,
): Promise<{ rows: ReferralSourceWithRelations[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.referralSource.findMany({
      where,
      include: referralSourceInclude,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.referralSource.count({ where }),
  ]);

  return { rows, total };
}

export function listActiveReferralSources() {
  return prisma.referralSource.findMany({
    where: { deletedAt: null, status: true },
    include: referralSourceInclude,
    orderBy: { name: "asc" },
  });
}

/** Every non-deleted source, regardless of status — settlements/incentives
 *  can reference a now-inactive source, so pickers on those pages must not
 *  be limited to active-only. */
export function listAllReferralSources() {
  return prisma.referralSource.findMany({
    where: { deletedAt: null },
    include: referralSourceInclude,
    orderBy: { name: "asc" },
  });
}

export function findReferralSourceById(id: string) {
  return prisma.referralSource.findFirst({
    where: { id, deletedAt: null },
    include: referralSourceInclude,
  });
}

export function createReferralSource(data: ReferralSourceWriteInput & { referralCode: string }) {
  return prisma.referralSource.create({
    data: {
      ...data,
      status: data.status ?? true,
      commissionPercentage: data.commissionPercentage ?? 0,
    },
    include: referralSourceInclude,
  });
}

export function updateReferralSource(id: string, data: ReferralSourceWriteInput) {
  return prisma.referralSource.update({
    where: { id },
    data,
    include: referralSourceInclude,
  });
}

export function softDeleteReferralSource(id: string) {
  return prisma.referralSource.update({
    where: { id },
    data: { deletedAt: new Date(), status: false },
    include: referralSourceInclude,
  });
}

export function restoreReferralSource(id: string) {
  return prisma.referralSource.update({
    where: { id },
    data: { deletedAt: null },
    include: referralSourceInclude,
  });
}

export function setReferralSourceStatus(id: string, status: boolean) {
  return prisma.referralSource.update({
    where: { id },
    data: { status },
    include: referralSourceInclude,
  });
}

export function assignPriceList(id: string, priceListId: string) {
  return prisma.referralSource.update({
    where: { id },
    data: { assignedPriceListId: priceListId },
    include: referralSourceInclude,
  });
}

export function removePriceList(id: string) {
  return prisma.referralSource.update({
    where: { id },
    data: { assignedPriceListId: null },
    include: referralSourceInclude,
  });
}

export function createPriceAssignmentHistory(
  referralSourceId: string,
  priceListId: string,
  assignedBy?: string | null,
) {
  return prisma.referralPriceAssignment.create({
    data: { referralSourceId, priceListId, assignedBy },
  });
}

export function listPriceAssignmentHistory(referralSourceId: string) {
  return prisma.referralPriceAssignment.findMany({
    where: { referralSourceId },
    include: { priceList: { select: { name: true } } },
    orderBy: { assignedAt: "desc" },
  });
}

export function createAuditLog(
  referralSourceId: string,
  action: string,
  performedByUserId?: string | null,
  note?: string | null,
) {
  return prisma.referralSourceAuditLog.create({
    data: { referralSourceId, action, performedByUserId, note },
  });
}

export function listAuditLogs(referralSourceId: string) {
  return prisma.referralSourceAuditLog.findMany({
    where: { referralSourceId },
    orderBy: { createdAt: "desc" },
  });
}
