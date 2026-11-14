export interface DashboardRange {
  from: string;
  to: string;
}

export interface DashboardBilling {
  total: number;
  collection: number;
  due: number;
  discount: number;
}

export interface DashboardReports {
  total: number;
  generated: number;
  submitted: number;
  pending: number;
}

export interface DashboardRegistration {
  total: number;
  paid: number;
  pending: number;
  discounted: number;
}

export interface DashboardB2B {
  business: number;
  collection: number;
  due: number;
}

export interface DashboardReferralRow {
  id: string;
  name: string;
  amount: number;
}

export interface DashboardPaymentBreakdown {
  cash: number;
  online: number;
}

export interface DashboardTestRow {
  id: string;
  name: string;
  count: number;
}

export interface DashboardSummary {
  range: DashboardRange;
  billing: DashboardBilling;
  reports: DashboardReports;
  registration: DashboardRegistration;
  b2b: DashboardB2B;
  topReferrals: DashboardReferralRow[];
  referralBusinessTotal: number;
  paymentBreakdown: DashboardPaymentBreakdown;
  topTests: DashboardTestRow[];
}

export type DashboardPeriod = "today" | "week" | "month" | "all";

export interface DashboardQueryParams {
  dateFrom?: string;
  dateTo?: string;
}
