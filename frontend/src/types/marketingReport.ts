export interface StaffMonthlyReport {
  marketingStaffId: string;
  staffName: string;
  employeeCode: string;
  revenueTarget: number;
  revenueAchieved: number;
  doctorTarget: number;
  doctorsAchieved: number;
  patientTarget: number;
  patientsAchieved: number;
  /** null when no target set (avoid divide-by-zero display; show "—") */
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
  rows: StaffMonthlyReport[];
  totals: MonthlyReportTotals;
}

export type LeaderboardRankBy = "revenueAchieved" | "achievementPercent" | "commissionAmount";

export interface LeaderboardEntry extends StaffMonthlyReport {
  rank: number;
}

export interface LeaderboardResult {
  month: number;
  year: number;
  rankBy: string;
  rows: LeaderboardEntry[];
}

export interface DashboardSummary {
  activeStaffCount: number;
  activeDoctorCount: number;
  currentMonth: number;
  currentYear: number;
  revenueTarget: number;
  revenueAchieved: number;
  overallAchievementPercent: number | null;
  upcomingVisitsCount: number;
}
