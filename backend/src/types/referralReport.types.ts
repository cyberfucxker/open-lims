export interface ReferralDashboardSummaryDto {
  totalReferrals: number;
  activeReferrals: number;
  patients: number;
  revenue: number;
  commission: number;
  settlements: number;
  recentSettlements: RecentSettlementDto[];
  typeDistribution: ReferralTypeDistributionDto[];
}

export interface RecentSettlementDto {
  id: string;
  referralSourceName: string;
  finalAmount: number;
  settlementStatus: string;
  createdAt: string;
}

export interface ReferralTypeDistributionDto {
  referralType: string;
  count: number;
}

export interface MonthlyRevenuePointDto {
  month: number;
  year: number;
  label: string;
  revenue: number;
  commission: number;
}

export interface ReferralPerformanceRowDto {
  referralSourceId: string;
  referralSourceName: string;
  referralType: string;
  patients: number;
  revenue: number;
  commission: number;
  avgRevenuePerPatient: number;
}

export interface ReferralPatientCountRowDto {
  referralSourceId: string;
  referralSourceName: string;
  patients: number;
}

export type ReferralRankBy = "revenue" | "patients" | "commission";

export interface ReferralRankingRowDto extends ReferralPerformanceRowDto {
  rank: number;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}
