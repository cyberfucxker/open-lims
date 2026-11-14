import { prisma } from "../config/database";

export interface IncentiveRow {
  referralSourceId: string;
  referralSourceName: string;
  referralType: string;
  patientId: string;
  billAmount: number;
  incentiveAmount: number;
  createdAt: Date;
}

/** Non-cancelled incentives (PENDING or SETTLED) within an optional date
 *  range — the base row set every performance/patient-count/ranking/revenue
 *  report reduces over in application code, mirroring the Marketing Staff
 *  Monthly Report's reduce-in-JS pattern. */
export async function listIncentiveRows(dateFrom?: Date, dateTo?: Date): Promise<IncentiveRow[]> {
  const rows = await prisma.referralIncentive.findMany({
    where: {
      incentiveStatus: { in: ["PENDING", "SETTLED"] },
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    select: {
      referralSourceId: true,
      patientId: true,
      billAmount: true,
      incentiveAmount: true,
      createdAt: true,
      referralSource: { select: { name: true, referralType: true } },
    },
  });

  return rows.map((row) => ({
    referralSourceId: row.referralSourceId,
    referralSourceName: row.referralSource.name,
    referralType: row.referralSource.referralType,
    patientId: row.patientId,
    billAmount: Number(row.billAmount),
    incentiveAmount: Number(row.incentiveAmount),
    createdAt: row.createdAt,
  }));
}

export function countTotalReferralSources() {
  return prisma.referralSource.count({ where: { deletedAt: null } });
}

export function countActiveReferralSources() {
  return prisma.referralSource.count({ where: { deletedAt: null, status: true } });
}

export function countSettlements(dateFrom?: Date, dateTo?: Date) {
  return prisma.referralSettlement.count({
    where:
      dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : undefined,
  });
}

export async function listRecentSettlements(limit: number) {
  return prisma.referralSettlement.findMany({
    include: { referralSource: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getTypeDistribution(): Promise<{ referralType: string; count: number }[]> {
  const grouped = await prisma.referralSource.groupBy({
    by: ["referralType"],
    where: { deletedAt: null },
    _count: { _all: true },
  });

  return grouped.map((group) => ({
    referralType: group.referralType,
    count: group._count._all,
  }));
}
