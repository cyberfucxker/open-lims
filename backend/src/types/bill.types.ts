import type { AppointmentPatientSummary, PaymentMode, PaymentStatus } from "./appointment.types";

/** Same as `AppointmentTestLine` plus the live Test catalogue's `shortName` —
 *  used as the invoice's "Test Code" column. `AppointmentTest` only snapshots
 *  `testName`/`price` at booking time, so `testCode` is joined in fresh from
 *  `Test` (never hard-deleted while referenced, so the join always resolves). */
export interface BillTestLine {
  testId: string;
  testCode: string;
  testName: string;
  price: number;
}

export type BillStatus = "ACTIVE" | "CANCELLED";
/** Query-time filter only — never stored. See `bill.repository.ts#buildWhere`. */
export type BillViewStatus = "all" | "due" | "paid" | "free" | "cancelled";
export type SendChannel = "WHATSAPP" | "EMAIL" | "SMS";
export type SendStatus = "SENT" | "FAILED";

export interface PaymentRecord {
  id: string;
  amount: number;
  mode: PaymentMode;
  transactionId?: string | null;
  paymentDate: string;
  createdAt: string;
}

export interface InvoiceSendLogRecord {
  id: string;
  channel: SendChannel;
  recipient: string;
  status: SendStatus;
  errorMessage?: string | null;
  sentAt: string;
}

export interface BillPatientSummary extends AppointmentPatientSummary {
  email?: string | null;
  organization?: string | null;
  referral?: string | null;
  /** Referral Management module link — not used by the existing Bill List
   *  UI, only by the Finance Reports "By Referral Wise Billing" grouping. */
  referralSourceId?: string | null;
}

export interface BillListItem {
  id: string;
  billNo: string;
  status: BillStatus;
  appointmentId: string;
  appointmentNo: string;
  isEmergency: boolean;
  patient: BillPatientSummary;
  createdByUserId?: string | null;
  createdBy?: string | null;
  tests: BillTestLine[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  additionalCharges: number;
  /** subtotal + additionalCharges, before discount — Finance Reports'
   *  "Gross Total" column. */
  grossTotal: number;
  netAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  /** Most recent recorded Payment, if any — null for a bill with no payment
   *  yet. Used by Finance Reports' "Receipt Date"/"Payment Mode" columns. */
  lastPaymentDate?: string | null;
  lastPaymentMode?: PaymentMode | null;
  appointmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillDetails extends BillListItem {
  payments: PaymentRecord[];
  sendLogs: InvoiceSendLogRecord[];
  printCount: number;
  lastPrintedAt?: string | null;
}

export interface ListBillsParams {
  view?: BillViewStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
  /** Forced to the caller's own Organization for a Collection Center portal
   *  caller — never taken from the query string in that case. */
  organizationId?: string;
  referralSourceId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface BillViewCounts {
  all: number;
  due: number;
  paid: number;
  free: number;
  cancelled: number;
}

export interface ListBillsResult {
  rows: BillListItem[];
  total: number;
  counts: BillViewCounts;
}

export interface AddPaymentInput {
  amount: number;
  mode: PaymentMode;
  transactionId?: string;
  paymentDate?: string;
}

export interface UpdateAdditionalChargesInput {
  additionalCharges: number;
}

export interface SendInvoiceInput {
  channel: SendChannel;
  recipient?: string;
}

export interface CreateBillForAppointmentData {
  appointmentId: string;
  /** The patient this appointment belongs to — used only to check for a
   *  Referral Management `referralSourceId` and auto-record a
   *  ReferralIncentive (see `referralIncentive.service.ts`); not persisted
   *  on `Bill` itself. */
  patientId: string;
  netAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  /** Only used to back-fill an initial Payment row when amountPaid > 0 — the
   *  registration flow's "amount received now" — so the payment ledger
   *  (`Payment` rows) always sums to `Bill.amountPaid`, never drifting. */
  paymentMode: PaymentMode;
  createdByUserId?: string | null;
}
