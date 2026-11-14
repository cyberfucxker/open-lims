import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ExpenseCategory,
  ExpenseCategoryFormValues,
  ExpenseFormValues,
  ExpenseListItem,
  ExpenseServiceFormValues,
  ExpenseServiceOption,
  ListExpensesParams,
  ListExpensesResult,
} from "@/types/expense";

export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const response = await httpClient.get<ApiResponseBody<ExpenseCategory[]>>(
    "/expenses/categories",
    { suppressErrorToast: true },
  );
  return response.data.data as ExpenseCategory[];
}

export async function createExpenseCategoryApi(
  values: ExpenseCategoryFormValues,
): Promise<ExpenseCategory> {
  const response = await httpClient.post<ApiResponseBody<ExpenseCategory>>(
    "/expenses/categories",
    values,
  );
  return response.data.data as ExpenseCategory;
}

export async function fetchExpenseServices(categoryId?: string): Promise<ExpenseServiceOption[]> {
  const response = await httpClient.get<ApiResponseBody<ExpenseServiceOption[]>>(
    "/expenses/services",
    { params: { categoryId }, suppressErrorToast: true },
  );
  return response.data.data as ExpenseServiceOption[];
}

export async function createExpenseServiceApi(
  values: ExpenseServiceFormValues,
): Promise<ExpenseServiceOption> {
  const response = await httpClient.post<ApiResponseBody<ExpenseServiceOption>>(
    "/expenses/services",
    values,
  );
  return response.data.data as ExpenseServiceOption;
}

export async function fetchExpenses(params: ListExpensesParams = {}): Promise<ListExpensesResult> {
  const response = await httpClient.get<ApiResponseBody<ListExpensesResult>>("/expenses", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListExpensesResult;
}

export async function createExpenseApi(values: ExpenseFormValues): Promise<ExpenseListItem> {
  const response = await httpClient.post<ApiResponseBody<ExpenseListItem>>("/expenses", values);
  return response.data.data as ExpenseListItem;
}

export async function fetchExpensesExcelBlob(params: ListExpensesParams = {}): Promise<Blob> {
  const response = await httpClient.get("/expenses/export/excel", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchExpensesPdfBlob(params: ListExpensesParams = {}): Promise<Blob> {
  const response = await httpClient.get("/expenses/export/pdf", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}
