export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardRangeDto {
  from: string;
  to: string;
}

export interface DashboardBillingDto {
  total: number;
  collection: number;
  due: number;
  discount: number;
}

export interface DashboardReportsDto {
  total: number;
  generated: number;
  submitted: number;
  pending: number;
}

export interface DashboardRegistrationDto {
  total: number;
  paid: number;
  pending: number;
  discounted: number;
}

export interface DashboardB2BDto {
  business: number;
  collection: number;
  due: number;
}

export interface DashboardReferralRowDto {
  id: string;
  name: string;
  amount: number;
}

export interface DashboardPaymentBreakdownDto {
  cash: number;
  online: number;
}

export interface DashboardTestRowDto {
  id: string;
  name: string;
  count: number;
}

export interface DashboardSummaryDto {
  range: DashboardRangeDto;
  billing: DashboardBillingDto;
  reports: DashboardReportsDto;
  registration: DashboardRegistrationDto;
  b2b: DashboardB2BDto;
  topReferrals: DashboardReferralRowDto[];
  referralBusinessTotal: number;
  paymentBreakdown: DashboardPaymentBreakdownDto;
  topTests: DashboardTestRowDto[];
}
