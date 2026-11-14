import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as expenseService from "../services/expense.service";
import type { ExpenseWriteData, ListExpensesParams } from "../types/expense.types";

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const result = await expenseService.listActiveCategories();
  res.status(200).json(ApiResponse.success("Expense categories retrieved successfully", result));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await expenseService.createCategory(req.body);
  res.status(201).json(ApiResponse.success("Expense category created successfully", result));
});

export const listServices = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.query as Record<string, string | undefined>;
  const result = await expenseService.listActiveServices(categoryId);
  res.status(200).json(ApiResponse.success("Expense services retrieved successfully", result));
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const result = await expenseService.createService(req.body);
  res.status(201).json(ApiResponse.success("Expense service created successfully", result));
});

function parseListParams(req: Request): ListExpensesParams {
  const q = req.query as Record<string, string | undefined>;
  return {
    search: q.search,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    categoryId: q.categoryId,
    serviceId: q.serviceId,
    page: q.page ? Number(q.page) : undefined,
    pageSize: q.pageSize ? Number(q.pageSize) : undefined,
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await expenseService.listExpenses(parseListParams(req));
  res.status(200).json(ApiResponse.success("Expenses retrieved successfully", result));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ExpenseWriteData;
  const result = await expenseService.createExpense(values, req.user?.id);
  res.status(201).json(ApiResponse.success("Expense recorded successfully", result));
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await expenseService.exportExpensesExcel(parseListParams(req));
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="expenses.xlsx"');
  res.send(buffer);
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await expenseService.exportExpensesPdf(parseListParams(req));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="expenses.pdf"');
  res.send(buffer);
});
