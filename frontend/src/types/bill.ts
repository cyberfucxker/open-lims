export type BillStatus = "ACTIVE" | "CANCELLED";
export type BillViewStatus = "all" | "due" | "paid" | "free" | "cancelled";
export type BillPaymentStatus = "PAID" | "PARTIAL" | "PENDING";
/** Full set an Appointment/Bill can display — Insurance/Credit only ever come
 *  from the original registration, never from a new Payment (see `PaymentModeInput`). */
export type PaymentMode = "Cash" | "Card" | "UPI" | "Insurance" | "Credit" | "Online";
/** What a new Payment can be recorded with (matches the backend's `addPaymentValidation`). */
export type PaymentModeInput = "Cash" | "Card" | "UPI" | "Online";
export type SendChannel = "WHATSAPP" | "EMAIL" | "SMS";
export type SendStatus = "SENT" | "FAILED";

export interface BillTestLine {
  testId: string;
  testCode: string;
  testName: string;
  price: number;
}

export interface BillPatientSummary {
  id: string;
  patientId: string;
  fullName: string;
  mobile: string;
  email?: string | null;
  gender: string;
  age: number;
  organization?: string | null;
  referral?: string | null;
}

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
  netAmount: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: BillPaymentStatus;
  paymentMode: PaymentMode;
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

export interface BillSearchFilters {
  view?: BillViewStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
}

export interface ListBillsParams extends BillSearchFilters {
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
  mode: PaymentModeInput;
  transactionId?: string;
  paymentDate?: string;
}

export interface SendInvoiceInput {
  channel: SendChannel;
  recipient?: string;
}
