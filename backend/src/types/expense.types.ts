import type { PaymentMode } from "./appointment.types";

export type ExpenseEntryType = "DEBIT" | "CREDIT";

export interface ExpenseCategoryDto {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface ExpenseCategoryWriteData {
  name: string;
}

export interface ExpenseServiceDto {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface ExpenseServiceWriteData {
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
  paymentMode: PaymentMode;
  paymentType: ExpenseEntryType;
  remarks: string | null;
  createdAt: string;
}

export interface ExpenseWriteData {
  categoryId: string;
  serviceId: string;
  invoiceDate: string;
  quantity: number;
  rate: number;
  amount: number;
  paymentMode: PaymentMode;
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
