import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { AreaApprovalRequestDto, AreaApprovalStatus } from "../types/areaApproval.types";

export interface CreateAreaApprovalRequestData {
  organizationId: string;
  cityId: string;
  name: string;
  pincodes: string[];
}

const withJoins = {
  organization: { select: { name: true, code: true } },
  city: { select: { name: true } },
} satisfies Prisma.AreaApprovalRequestInclude;

type AreaApprovalRequestRow = Prisma.AreaApprovalRequestGetPayload<{ include: typeof withJoins }>;

export function toAreaApprovalRequestDto(row: AreaApprovalRequestRow): AreaApprovalRequestDto {
  return {
    id: row.id,
    organizationId: row.organizationId,
    organizationName: row.organization.name,
    organizationCode: row.organization.code,
    cityId: row.cityId,
    cityName: row.city.name,
    name: row.name,
    pincodes: row.pincodes,
    status: row.status,
    rejectionReason: row.rejectionReason,
    approvedAreaId: row.approvedAreaId,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

export function createAreaApprovalRequest(data: CreateAreaApprovalRequestData) {
  return prisma.areaApprovalRequest.create({ data, include: withJoins });
}

export interface ListAreaApprovalRequestsFilter {
  organizationId?: string;
  status?: AreaApprovalStatus;
  skip?: number;
  take?: number;
}

export async function listAreaApprovalRequests(
  filter: ListAreaApprovalRequestsFilter,
): Promise<{ rows: AreaApprovalRequestRow[]; total: number }> {
  const where: Prisma.AreaApprovalRequestWhereInput = {
    organizationId: filter.organizationId,
    status: filter.status,
  };

  const [rows, total] = await Promise.all([
    prisma.areaApprovalRequest.findMany({
      where,
      include: withJoins,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.areaApprovalRequest.count({ where }),
  ]);

  return { rows, total };
}

export function findAreaApprovalRequestById(id: string) {
  return prisma.areaApprovalRequest.findUnique({ where: { id }, include: withJoins });
}

export function findPendingRequestByName(organizationId: string, name: string) {
  return prisma.areaApprovalRequest.findFirst({
    where: { organizationId, status: "PENDING", name: { equals: name, mode: "insensitive" } },
  });
}

/** Transaction-scoped — used by `approveAreaApprovalRequest`, which creates
 *  the Area and the org's assignment to it in the same transaction as this
 *  update, so none of the three can succeed without the others. */
export function markAreaApprovalRequestApprovedTx(
  tx: Prisma.TransactionClient,
  id: string,
  data: { approvedAreaId: string; reviewedByUserId: string },
) {
  return tx.areaApprovalRequest.update({
    where: { id },
    data: { ...data, status: "APPROVED", reviewedAt: new Date() },
    include: withJoins,
  });
}

export function markAreaApprovalRequestRejected(
  id: string,
  data: { rejectionReason: string | null; reviewedByUserId: string },
) {
  return prisma.areaApprovalRequest.update({
    where: { id },
    data: { ...data, status: "REJECTED", reviewedAt: new Date() },
    include: withJoins,
  });
}
