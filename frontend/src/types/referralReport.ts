import type { ReferralType } from "@/types/referralSource";

export type SettlementStatus = "PENDING" | "PAID" | "CANCELLED";

export interface RecentSettlement {
  id: string;
  referralSourceName: string;
  finalAmount: number;
  settlementStatus: SettlementStatus;
  createdAt: string;
}

export interface ReferralTypeDistribution {
  referralType: ReferralType;
  count: number;
}

export interface ReferralDashboardSummary {
  totalReferrals: number;
  activeReferrals: number;
  patients: number;
  revenue: number;
  commission: number;
  settlements: number;
  recentSettlements: RecentSettlement[];
  typeDistribution: ReferralTypeDistribution[];
}

export interface MonthlyRevenuePoint {
  month: number;
  year: number;
  label: string;
  revenue: number;
  commission: number;
}

export type ReferralRankBy = "revenue" | "patients" | "commission";

export interface ReferralRankingRow {
  referralSourceId: string;
  referralSourceName: string;
  referralType: ReferralType;
  patients: number;
  revenue: number;
  commission: number;
  avgRevenuePerPatient: number;
  rank: number;
}

export interface ReferralRankingParams {
  dateFrom?: string;
  dateTo?: string;
  rankBy?: ReferralRankBy;
}
