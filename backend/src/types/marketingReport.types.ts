export interface StaffMonthlyReportDto {
  marketingStaffId: string;
  staffName: string;
  employeeCode: string;
  revenueTarget: number;
  revenueAchieved: number;
  doctorTarget: number;
  doctorsAchieved: number;
  patientTarget: number;
  patientsAchieved: number;
  achievementPercent: number | null;
  commissionAmount: number;
}

export interface MonthlyReportTotals {
  revenueTarget: number;
  revenueAchieved: number;
  doctorTarget: number;
  doctorsAchieved: number;
  patientTarget: number;
  patientsAchieved: number;
  commissionAmount: number;
  overallAchievementPercent: number | null;
}

export interface MonthlyReportResult {
  month: number;
  year: number;
  rows: StaffMonthlyReportDto[];
  totals: MonthlyReportTotals;
}

export type LeaderboardRankBy = "revenueAchieved" | "achievementPercent" | "commissionAmount";

export interface LeaderboardEntryDto extends StaffMonthlyReportDto {
  rank: number;
}

export interface LeaderboardResult {
  month: number;
  year: number;
  rankBy: LeaderboardRankBy;
  rows: LeaderboardEntryDto[];
}

export interface DashboardSummaryDto {
  activeStaffCount: number;
  activeDoctorCount: number;
  currentMonth: number;
  currentYear: number;
  revenueTarget: number;
  revenueAchieved: number;
  overallAchievementPercent: number | null;
  upcomingVisitsCount: number;
}
