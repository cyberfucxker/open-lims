import type { Prisma, ReferralSettlement } from "@prisma/client";
import { prisma } from "../config/database";
import { joinFullName } from "../utils/name";
import type {
  ReferralSettlementDto,
  ReferralSettlementIncentiveLine,
  SettlementStatus,
} from "../types/referralSettlement.types";

type ReferralSettlementWithSource = ReferralSettlement & { referralSource: { name: string } };

const referralSettlementInclude = {
  referralSource: { select: { name: true } },
} satisfies Prisma.ReferralSettlementInclude;

export interface ListReferralSettlementsFilter {
  referralSourceId?: string;
  settlementStatus?: SettlementStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

const SORTABLE_FIELDS = new Set([
  "fromDate",
  "toDate",
  "totalRevenue",
  "finalAmount",
  "settlementStatus",
  "createdAt",
]);

export function toReferralSettlementDto(
  settlement: ReferralSettlementWithSource,
): ReferralSettlementDto {
  return {
    id: settlement.id,
    referralSourceId: settlement.referralSourceId,
    referralSourceName: settlement.referralSource.name,
    fromDate: settlement.fromDate.toISOString().slice(0, 10),
    toDate: settlement.toDate.toISOString().slice(0, 10),
    totalPatients: settlement.totalPatients,
    totalRevenue: Number(settlement.totalRevenue),
    commissionPercentage: Number(settlement.commissionPercentage),
    commissionAmount: Number(settlement.commissionAmount),
    adjustment: Number(settlement.adjustment),
    finalAmount: Number(settlement.finalAmount),
    settlementStatus: settlement.settlementStatus as SettlementStatus,
    paymentDate: settlement.paymentDate ? settlement.paymentDate.toISOString() : null,
    remarks: settlement.remarks,
    createdAt: settlement.createdAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListReferralSettlementsFilter,
    "referralSourceId" | "settlementStatus" | "dateFrom" | "dateTo" | "search"
  >,
): Prisma.ReferralSettlementWhereInput {
  const where: Prisma.ReferralSettlementWhereInput = {};

  if (filter.referralSourceId) {
    where.referralSourceId = filter.referralSourceId;
  }
  if (filter.settlementStatus) {
    where.settlementStatus = filter.settlementStatus;
  }
  if (filter.dateFrom || filter.dateTo) {
    where.fromDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }
  if (filter.search) {
    where.referralSource = { name: { contains: filter.search, mode: "insensitive" } };
  }

  return where;
}

function buildOrderBy(
  sortBy?: string,
  sortDir?: string,
): Prisma.ReferralSettlementOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listReferralSettlements(
  filter: ListReferralSettlementsFilter,
): Promise<{ rows: ReferralSettlementWithSource[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.referralSettlement.findMany({
      where,
      include: referralSettlementInclude,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.referralSettlement.count({ where }),
  ]);

  return { rows, total };
}

export function listAllForExport(
  filter: Pick<
    ListReferralSettlementsFilter,
    "referralSourceId" | "settlementStatus" | "dateFrom" | "dateTo" | "search"
  >,
) {
  return prisma.referralSettlement.findMany({
    where: buildWhere(filter),
    include: referralSettlementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string) {
  return prisma.referralSettlement.findUnique({
    where: { id },
    include: referralSettlementInclude,
  });
}

export async function findIncentiveLines(
  settlementId: string,
): Promise<ReferralSettlementIncentiveLine[]> {
  const incentives = await prisma.referralIncentive.findMany({
    where: { settlementId },
    include: {
      bill: { select: { billNo: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return incentives.map((incentive) => ({
    id: incentive.id,
    patientName: joinFullName(incentive.patient.firstName, incentive.patient.lastName),
    billNo: incentive.bill.billNo,
    billAmount: Number(incentive.billAmount),
    incentiveAmount: Number(incentive.incentiveAmount),
  }));
}

export interface CreateSettlementData {
  referralSourceId: string;
  fromDate: Date;
  toDate: Date;
  totalPatients: number;
  totalRevenue: number;
  commissionPercentage: number;
  commissionAmount: number;
  adjustment: number;
  finalAmount: number;
  remarks?: string | null;
}

export function createSettlement(data: CreateSettlementData, tx: Prisma.TransactionClient) {
  return tx.referralSettlement.create({ data, include: referralSettlementInclude });
}

export function markPaid(id: string) {
  return prisma.referralSettlement.update({
    where: { id },
    data: { settlementStatus: "PAID", paymentDate: new Date() },
    include: referralSettlementInclude,
  });
}

export function cancel(id: string, tx: Prisma.TransactionClient) {
  return tx.referralSettlement.update({
    where: { id },
    data: { settlementStatus: "CANCELLED" },
    include: referralSettlementInclude,
  });
}
