import * as expenseRepository from "../repositories/expense.repository";
import {
  toExpenseCategoryDto,
  toExpenseListItem,
  toExpenseServiceDto,
} from "../repositories/expense.repository";
import { generateExpenseListExcel } from "./excelExport.service";
import { generateExpenseListPdf } from "./invoicePdf.service";
import type {
  ExpenseCategoryDto,
  ExpenseCategoryWriteData,
  ExpenseListItem,
  ExpenseServiceDto,
  ExpenseServiceWriteData,
  ExpenseWriteData,
  ListExpensesParams,
  ListExpensesResult,
} from "../types/expense.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export async function listActiveCategories(): Promise<ExpenseCategoryDto[]> {
  const rows = await expenseRepository.listActiveExpenseCategories();
  return rows.map(toExpenseCategoryDto);
}

export async function createCategory(data: ExpenseCategoryWriteData): Promise<ExpenseCategoryDto> {
  const category = await expenseRepository.createExpenseCategory(data);
  return toExpenseCategoryDto(category);
}

export async function listActiveServices(categoryId?: string): Promise<ExpenseServiceDto[]> {
  const rows = await expenseRepository.listActiveExpenseServices(categoryId);
  return rows.map(toExpenseServiceDto);
}

export async function createService(data: ExpenseServiceWriteData): Promise<ExpenseServiceDto> {
  const service = await expenseRepository.createExpenseService(data);
  return toExpenseServiceDto(service);
}

export async function listExpenses(params: ListExpensesParams): Promise<ListExpensesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total, subTotal } = await expenseRepository.listExpenses({
    ...params,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toExpenseListItem), total, subTotal };
}

async function listAllExpensesForExport(params: ListExpensesParams): Promise<ExpenseListItem[]> {
  const rows = await expenseRepository.listAllExpensesForExport(params);
  return rows.map(toExpenseListItem);
}

export async function createExpense(
  data: ExpenseWriteData,
  createdByUserId?: string | null,
): Promise<ExpenseListItem> {
  const expense = await expenseRepository.createExpense(data, createdByUserId);
  return toExpenseListItem(expense);
}

export async function exportExpensesExcel(params: ListExpensesParams): Promise<Buffer> {
  const expenses = await listAllExpensesForExport(params);
  return generateExpenseListExcel(expenses);
}

export async function exportExpensesPdf(params: ListExpensesParams): Promise<Buffer> {
  const expenses = await listAllExpensesForExport(params);
  return generateExpenseListPdf(expenses);
}
