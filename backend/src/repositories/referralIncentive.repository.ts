import type { Prisma, ReferralIncentive } from "@prisma/client";
import { prisma } from "../config/database";
import { joinFullName } from "../utils/name";
import type {
  IncentiveStatus,
  MonthlyIncentiveSummaryDto,
  ReferralIncentiveDto,
} from "../types/referralIncentive.types";

type ReferralIncentiveWithRelations = ReferralIncentive & {
  referralSource: { name: string };
  bill: { billNo: string };
  patient: { firstName: string; lastName: string };
};

const referralIncentiveInclude = {
  referralSource: { select: { name: true } },
  bill: { select: { billNo: true } },
  patient: { select: { firstName: true, lastName: true } },
} satisfies Prisma.ReferralIncentiveInclude;

export interface CreateReferralIncentiveData {
  referralSourceId: string;
  billId: string;
  patientId: string;
  billAmount: number;
  commissionPercentage: number;
  incentiveAmount: number;
}

export interface ListReferralIncentivesFilter {
  referralSourceId?: string;
  incentiveStatus?: IncentiveStatus;
  dateFrom?: string;
  dateTo?: string;
  skip: number;
  take: number;
}

export function toReferralIncentiveDto(
  incentive: ReferralIncentiveWithRelations,
): ReferralIncentiveDto {
  return {
    id: incentive.id,
    referralSourceId: incentive.referralSourceId,
    referralSourceName: incentive.referralSource.name,
    billId: incentive.billId,
    billNo: incentive.bill.billNo,
    patientId: incentive.patientId,
    patientName: joinFullName(incentive.patient.firstName, incentive.patient.lastName),
    billAmount: Number(incentive.billAmount),
    commissionPercentage: Number(incentive.commissionPercentage),
    incentiveAmount: Number(incentive.incentiveAmount),
    incentiveStatus: incentive.incentiveStatus as IncentiveStatus,
    settlementId: incentive.settlementId,
    createdAt: incentive.createdAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListReferralIncentivesFilter,
    "referralSourceId" | "incentiveStatus" | "dateFrom" | "dateTo"
  >,
): Prisma.ReferralIncentiveWhereInput {
  const where: Prisma.ReferralIncentiveWhereInput = {};

  if (filter.referralSourceId) {
    where.referralSourceId = filter.referralSourceId;
  }
  if (filter.incentiveStatus) {
    where.incentiveStatus = filter.incentiveStatus;
  }
  if (filter.dateFrom || filter.dateTo) {
    where.createdAt = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  return where;
}

export async function listReferralIncentives(
  filter: ListReferralIncentivesFilter,
): Promise<{ rows: ReferralIncentiveWithRelations[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.referralIncentive.findMany({
      where,
      include: referralIncentiveInclude,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.referralIncentive.count({ where }),
  ]);

  return { rows, total };
}

export function findByBillId(billId: string) {
  return prisma.referralIncentive.findUnique({ where: { billId } });
}

export function createReferralIncentive(
  data: CreateReferralIncentiveData,
  tx: Prisma.TransactionClient,
) {
  return tx.referralIncentive.create({ data });
}

type Executor = Prisma.TransactionClient | typeof prisma;

export function setIncentiveStatusByBillId(
  billId: string,
  incentiveStatus: IncentiveStatus,
  executor: Executor = prisma,
) {
  return executor.referralIncentive.updateMany({ where: { billId }, data: { incentiveStatus } });
}

/** All PENDING incentives for a source within a date range — the exact set
 *  "Generate Settlement" rolls up; not yet marked SETTLED. */
export function listPendingIncentivesForSettlement(
  referralSourceId: string,
  fromDate: Date,
  toDateExclusive: Date,
  executor: Executor = prisma,
) {
  return executor.referralIncentive.findMany({
    where: {
      referralSourceId,
      incentiveStatus: "PENDING",
      createdAt: { gte: fromDate, lt: toDateExclusive },
    },
  });
}

export function markIncentivesSettled(
  incentiveIds: string[],
  settlementId: string,
  tx: Prisma.TransactionClient,
) {
  return tx.referralIncentive.updateMany({
    where: { id: { in: incentiveIds } },
    data: { incentiveStatus: "SETTLED", settlementId },
  });
}

export function revertIncentivesForSettlement(settlementId: string, tx: Prisma.TransactionClient) {
  return tx.referralIncentive.updateMany({
    where: { settlementId },
    data: { incentiveStatus: "PENDING", settlementId: null },
  });
}

export async function getMonthlyIncentiveSummary(
  month: number,
  year: number,
): Promise<MonthlyIncentiveSummaryDto[]> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(
    Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1),
  );

  const rows = await prisma.referralIncentive.findMany({
    where: { createdAt: { gte: start, lt: endExclusive } },
    include: { referralSource: { select: { id: true, name: true } } },
  });

  return Array.from(aggregateByReferralSource(rows).values());
}

function aggregateByReferralSource(
  rows: Array<ReferralIncentive & { referralSource: { id: string; name: string } }>,
): Map<string, MonthlyIncentiveSummaryDto> {
  const map = new Map<string, MonthlyIncentiveSummaryDto>();
  for (const row of rows) {
    const key = row.referralSourceId;
    const entry = map.get(key) ?? {
      referralSourceId: key,
      referralSourceName: row.referralSource.name,
      patientCount: 0,
      totalRevenue: 0,
      totalIncentive: 0,
    };
    entry.patientCount += 1;
    entry.totalRevenue += Number(row.billAmount);
    entry.totalIncentive += Number(row.incentiveAmount);
    map.set(key, entry);
  }
  return map;
}
