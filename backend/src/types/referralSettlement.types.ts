export type SettlementStatus = "PENDING" | "PAID" | "CANCELLED";

export interface ReferralSettlementDto {
  id: string;
  referralSourceId: string;
  referralSourceName: string;
  fromDate: string;
  toDate: string;
  totalPatients: number;
  totalRevenue: number;
  commissionPercentage: number;
  commissionAmount: number;
  adjustment: number;
  finalAmount: number;
  settlementStatus: SettlementStatus;
  paymentDate: string | null;
  remarks: string | null;
  createdAt: string;
}

export interface ReferralSettlementIncentiveLine {
  id: string;
  patientName: string;
  billNo: string;
  billAmount: number;
  incentiveAmount: number;
}

export interface ReferralSettlementDetailsDto extends ReferralSettlementDto {
  incentives: ReferralSettlementIncentiveLine[];
}

export interface GenerateSettlementInput {
  referralSourceId: string;
  fromDate: string;
  toDate: string;
  adjustment?: number;
  remarks?: string;
}

export interface ListReferralSettlementsParams {
  referralSourceId?: string;
  settlementStatus?: SettlementStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReferralSettlementsResult {
  rows: ReferralSettlementDto[];
  total: number;
}
