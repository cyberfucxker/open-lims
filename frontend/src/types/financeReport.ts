export type FinanceReportGroupBy = "date" | "organisation" | "referral";

export interface FinanceReportFilters {
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
  referralSourceId?: string;
  includeCancelled?: boolean;
  onlyCancelled?: boolean;
  includeFree?: boolean;
  groupBy?: FinanceReportGroupBy;
}

export interface FinanceReportRow {
  id: string;
  billNo: string;
  patientName: string;
  patientGender: string;
  patientAge: string;
  appointmentNo: string;
  registrationDate: string;
  receiptDate: string | null;
  grossTotal: number;
  netAmount: number;
  paidAmount: number;
  discountAmount: number;
  dueAmount: number;
  paymentMode: string | null;
  organization: string | null;
  doctor: string | null;
  status: "ACTIVE" | "CANCELLED";
}

export interface FinanceReportSummary {
  totalNetAmount: number;
  totalCollectionAmount: number;
  totalDiscountAmount: number;
  totalDueAmount: number;
  cash: number;
  online: number;
}

export interface FinanceReportGroupRow {
  id: string;
  name: string;
  billCount: number;
  netAmount: number;
  collectionAmount: number;
  discountAmount: number;
  dueAmount: number;
}

export interface FinanceReportResult {
  summary: FinanceReportSummary;
  rows: FinanceReportRow[];
  groups: FinanceReportGroupRow[];
}
