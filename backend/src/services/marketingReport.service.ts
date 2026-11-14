import * as marketingReportRepository from "../repositories/marketingReport.repository";
import * as doctorVisitRepository from "../repositories/doctorVisit.repository";
import {
  calculateCommissionFromSlabs,
  listActiveCommissionSlabDtos,
} from "./commissionSlab.service";
import type {
  DashboardSummaryDto,
  LeaderboardRankBy,
  LeaderboardResult,
  MonthlyReportResult,
  MonthlyReportTotals,
  StaffMonthlyReportDto,
} from "../types/marketingReport.types";

interface StaffAccumulator {
  revenueAchieved: number;
  patientIds: Set<string>;
  doctorIds: Set<string>;
}

function monthRange(month: number, year: number): { start: Date; endExclusive: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(
    Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1),
  );
  return { start, endExclusive };
}

function achievementPercent(target: number, achieved: number): number | null {
  if (!target || target <= 0) return null;
  return Math.round((achieved / target) * 10000) / 100;
}

async function buildStaffRows(month: number, year: number): Promise<StaffMonthlyReportDto[]> {
  const { start, endExclusive } = monthRange(month, year);

  const [staff, targets, doctorToStaffMap, billedReferrals, activeSlabs] = await Promise.all([
    marketingReportRepository.listAllStaffForReport(),
    marketingReportRepository.listTargetsForMonth(month, year),
    marketingReportRepository.loadDoctorToStaffMap(),
    marketingReportRepository.listBilledReferralsForMonth(start, endExclusive),
    listActiveCommissionSlabDtos(),
  ]);

  const targetsByStaff = new Map(targets.map((target) => [target.marketingStaffId, target]));
  const accumulators = new Map<string, StaffAccumulator>();

  for (const row of billedReferrals) {
    const staffId = doctorToStaffMap.get(row.referralDoctorId);
    if (!staffId) continue;

    const acc = accumulators.get(staffId) ?? {
      revenueAchieved: 0,
      patientIds: new Set<string>(),
      doctorIds: new Set<string>(),
    };
    acc.revenueAchieved += row.netAmount;
    acc.patientIds.add(row.patientId);
    acc.doctorIds.add(row.referralDoctorId);
    accumulators.set(staffId, acc);
  }

  const rows: StaffMonthlyReportDto[] = [];
  for (const member of staff) {
    const target = targetsByStaff.get(member.id);
    const acc = accumulators.get(member.id);

    const revenueTarget = target?.revenueTarget ?? 0;
    const doctorTarget = target?.doctorTarget ?? 0;
    const patientTarget = target?.patientTarget ?? 0;
    const revenueAchieved = acc?.revenueAchieved ?? 0;
    const doctorsAchieved = acc?.doctorIds.size ?? 0;
    const patientsAchieved = acc?.patientIds.size ?? 0;

    const { amount: commissionAmount } = calculateCommissionFromSlabs(revenueAchieved, activeSlabs);

    rows.push({
      marketingStaffId: member.id,
      staffName: member.name,
      employeeCode: member.employeeCode,
      revenueTarget,
      revenueAchieved,
      doctorTarget,
      doctorsAchieved,
      patientTarget,
      patientsAchieved,
      achievementPercent: achievementPercent(revenueTarget, revenueAchieved),
      commissionAmount,
    });
  }

  return rows;
}

function computeTotals(rows: StaffMonthlyReportDto[]): MonthlyReportTotals {
  const totals = rows.reduce(
    (acc, row) => {
      acc.revenueTarget += row.revenueTarget;
      acc.revenueAchieved += row.revenueAchieved;
      acc.doctorTarget += row.doctorTarget;
      acc.doctorsAchieved += row.doctorsAchieved;
      acc.patientTarget += row.patientTarget;
      acc.patientsAchieved += row.patientsAchieved;
      acc.commissionAmount += row.commissionAmount;
      return acc;
    },
    {
      revenueTarget: 0,
      revenueAchieved: 0,
      doctorTarget: 0,
      doctorsAchieved: 0,
      patientTarget: 0,
      patientsAchieved: 0,
      commissionAmount: 0,
    },
  );

  return {
    ...totals,
    overallAchievementPercent: achievementPercent(totals.revenueTarget, totals.revenueAchieved),
  };
}

export async function getMonthlyReport(month: number, year: number): Promise<MonthlyReportResult> {
  const rows = await buildStaffRows(month, year);
  return { month, year, rows, totals: computeTotals(rows) };
}

export async function getLeaderboard(
  month: number,
  year: number,
  rankBy: LeaderboardRankBy = "achievementPercent",
): Promise<LeaderboardResult> {
  const rows = await buildStaffRows(month, year);

  const sorted = [...rows].sort((a, b) => {
    const aValue = a[rankBy] ?? -Infinity;
    const bValue = b[rankBy] ?? -Infinity;
    return bValue - aValue;
  });

  return {
    month,
    year,
    rankBy,
    rows: sorted.map((row, index) => ({ ...row, rank: index + 1 })),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [rows, activeStaffCount, activeDoctorCount, upcomingVisits] = await Promise.all([
    buildStaffRows(month, year),
    marketingReportRepository.countActiveMarketingStaff(),
    marketingReportRepository.countActiveReferralDoctors(),
    doctorVisitRepository.listUpcomingVisits(7),
  ]);

  const totals = computeTotals(rows);

  return {
    activeStaffCount,
    activeDoctorCount,
    currentMonth: month,
    currentYear: year,
    revenueTarget: totals.revenueTarget,
    revenueAchieved: totals.revenueAchieved,
    overallAchievementPercent: totals.overallAchievementPercent,
    upcomingVisitsCount: upcomingVisits.length,
  };
}
