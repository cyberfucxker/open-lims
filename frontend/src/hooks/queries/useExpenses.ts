import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createExpenseApi,
  createExpenseCategoryApi,
  createExpenseServiceApi,
  fetchExpenseCategories,
  fetchExpenseServices,
  fetchExpenses,
} from "@/services/api/expenseApi";
import type {
  ExpenseCategoryFormValues,
  ExpenseFormValues,
  ExpenseServiceFormValues,
  ListExpensesParams,
} from "@/types/expense";

export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expenseCategories"],
    queryFn: fetchExpenseCategories,
  });
}

export function useExpenseServices(categoryId?: string) {
  return useQuery({
    queryKey: ["expenseServices", categoryId],
    queryFn: () => fetchExpenseServices(categoryId),
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ExpenseCategoryFormValues) => createExpenseCategoryApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
    },
  });
}

export function useCreateExpenseService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ExpenseServiceFormValues) => createExpenseServiceApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenseServices"] });
    },
  });
}

export function useExpenses(params: ListExpensesParams) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => fetchExpenses(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ExpenseFormValues) => createExpenseApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
