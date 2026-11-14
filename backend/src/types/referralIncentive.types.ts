export type IncentiveStatus = "PENDING" | "SETTLED" | "CANCELLED";

export interface ReferralIncentiveDto {
  id: string;
  referralSourceId: string;
  referralSourceName: string;
  billId: string;
  billNo: string;
  patientId: string;
  patientName: string;
  billAmount: number;
  commissionPercentage: number;
  incentiveAmount: number;
  incentiveStatus: IncentiveStatus;
  settlementId: string | null;
  createdAt: string;
}

export interface ListReferralIncentivesParams {
  referralSourceId?: string;
  incentiveStatus?: IncentiveStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReferralIncentivesResult {
  rows: ReferralIncentiveDto[];
  total: number;
}

export interface MonthlyIncentiveParams {
  month: number;
  year: number;
}

export interface MonthlyIncentiveSummaryDto {
  referralSourceId: string;
  referralSourceName: string;
  patientCount: number;
  totalRevenue: number;
  totalIncentive: number;
}
