export type ExpenseEntryType = "DEBIT" | "CREDIT";

/** Same set as the backend's PaymentMode enum — a superset of the patient
 *  registration form's `PaymentMode` (@/types/patient), which omits "Online"
 *  since that mode only applies to Bill/Expense payments, never an
 *  Appointment's original booking-time payment mode. */
export type ExpensePaymentMode = "Cash" | "Card" | "UPI" | "Insurance" | "Credit" | "Online";

export interface ExpenseCategory {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface ExpenseCategoryFormValues {
  name: string;
}

export interface ExpenseServiceOption {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface ExpenseServiceFormValues {
  categoryId: string;
  name: string;
}

export interface ExpenseListItem {
  id: string;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  invoiceDate: string;
  quantity: number;
  rate: number;
  amount: number;
  paymentMode: ExpensePaymentMode;
  paymentType: ExpenseEntryType;
  remarks: string | null;
  createdAt: string;
}

export interface ExpenseFormValues {
  categoryId: string;
  serviceId: string;
  invoiceDate: string;
  quantity: number;
  rate: number;
  amount: number;
  paymentMode: ExpensePaymentMode;
  paymentType?: ExpenseEntryType;
  remarks?: string;
}

export interface ListExpensesParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  serviceId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListExpensesResult {
  rows: ExpenseListItem[];
  total: number;
  subTotal: number;
}
