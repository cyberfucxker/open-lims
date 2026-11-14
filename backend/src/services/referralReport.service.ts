import * as referralReportRepository from "../repositories/referralReport.repository";
import type { IncentiveRow } from "../repositories/referralReport.repository";
import type {
  DateRangeParams,
  MonthlyRevenuePointDto,
  ReferralDashboardSummaryDto,
  ReferralPatientCountRowDto,
  ReferralPerformanceRowDto,
  ReferralRankBy,
  ReferralRankingRowDto,
  ReferralTypeDistributionDto,
} from "../types/referralReport.types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function currentMonthRange(): { start: Date; endExclusive: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, endExclusive };
}

interface Aggregate {
  referralSourceId: string;
  referralSourceName: string;
  referralType: string;
  patientIds: Set<string>;
  revenue: number;
  commission: number;
}

function aggregateBySource(rows: IncentiveRow[]): Aggregate[] {
  const map = new Map<string, Aggregate>();
  for (const row of rows) {
    const entry = map.get(row.referralSourceId) ?? {
      referralSourceId: row.referralSourceId,
      referralSourceName: row.referralSourceName,
      referralType: row.referralType,
      patientIds: new Set<string>(),
      revenue: 0,
      commission: 0,
    };
    entry.patientIds.add(row.patientId);
    entry.revenue += row.billAmount;
    entry.commission += row.incentiveAmount;
    map.set(row.referralSourceId, entry);
  }
  return Array.from(map.values());
}

export async function getDashboardSummary(): Promise<ReferralDashboardSummaryDto> {
  const { start, endExclusive } = currentMonthRange();

  const [totalReferrals, activeReferrals, rows, settlements, recentSettlements, typeDistribution] =
    await Promise.all([
      referralReportRepository.countTotalReferralSources(),
      referralReportRepository.countActiveReferralSources(),
      referralReportRepository.listIncentiveRows(start, endExclusive),
      referralReportRepository.countSettlements(start, endExclusive),
      referralReportRepository.listRecentSettlements(5),
      referralReportRepository.getTypeDistribution(),
    ]);

  const patientIds = new Set(rows.map((row) => row.patientId));
  const revenue = round2(rows.reduce((sum, row) => sum + row.billAmount, 0));
  const commission = round2(rows.reduce((sum, row) => sum + row.incentiveAmount, 0));

  return {
    totalReferrals,
    activeReferrals,
    patients: patientIds.size,
    revenue,
    commission,
    settlements,
    recentSettlements: recentSettlements.map((settlement) => ({
      id: settlement.id,
      referralSourceName: settlement.referralSource.name,
      finalAmount: Number(settlement.finalAmount),
      settlementStatus: settlement.settlementStatus,
      createdAt: settlement.createdAt.toISOString(),
    })),
    typeDistribution,
  };
}

export async function getMonthlyRevenueTrend(months: number): Promise<MonthlyRevenuePointDto[]> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const rows = await referralReportRepository.listIncentiveRows(start, undefined);

  const points: MonthlyRevenuePointDto[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const pointDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const month = pointDate.getUTCMonth() + 1;
    const year = pointDate.getUTCFullYear();

    const monthRows = rows.filter(
      (row) => row.createdAt.getUTCFullYear() === year && row.createdAt.getUTCMonth() + 1 === month,
    );

    points.push({
      month,
      year,
      label: `${MONTH_LABELS[month - 1]} ${year}`,
      revenue: round2(monthRows.reduce((sum, row) => sum + row.billAmount, 0)),
      commission: round2(monthRows.reduce((sum, row) => sum + row.incentiveAmount, 0)),
    });
  }

  return points;
}

async function buildPerformanceRows(params: DateRangeParams): Promise<ReferralPerformanceRowDto[]> {
  const rows = await referralReportRepository.listIncentiveRows(
    params.dateFrom ? new Date(params.dateFrom) : undefined,
    params.dateTo ? new Date(params.dateTo) : undefined,
  );

  return aggregateBySource(rows).map((entry) => ({
    referralSourceId: entry.referralSourceId,
    referralSourceName: entry.referralSourceName,
    referralType: entry.referralType,
    patients: entry.patientIds.size,
    revenue: round2(entry.revenue),
    commission: round2(entry.commission),
    avgRevenuePerPatient:
      entry.patientIds.size > 0 ? round2(entry.revenue / entry.patientIds.size) : 0,
  }));
}

export async function getPerformance(
  params: DateRangeParams,
): Promise<ReferralPerformanceRowDto[]> {
  return buildPerformanceRows(params);
}

export async function getPatientCount(
  params: DateRangeParams,
): Promise<ReferralPatientCountRowDto[]> {
  const rows = await buildPerformanceRows(params);
  return rows
    .map((row) => ({
      referralSourceId: row.referralSourceId,
      referralSourceName: row.referralSourceName,
      patients: row.patients,
    }))
    .sort((a, b) => b.patients - a.patients);
}

export async function getRanking(
  params: DateRangeParams,
  rankBy: ReferralRankBy = "revenue",
): Promise<ReferralRankingRowDto[]> {
  const rows = await buildPerformanceRows(params);

  const metricKey =
    rankBy === "patients" ? "patients" : rankBy === "commission" ? "commission" : "revenue";
  const sorted = [...rows].sort((a, b) => b[metricKey] - a[metricKey]);

  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getTypeDistribution(): Promise<ReferralTypeDistributionDto[]> {
  return referralReportRepository.getTypeDistribution();
}
