import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCategoryApi,
  deleteCategoryApi,
  fetchCategories,
  restoreCategoryApi,
  setCategoryStatusApi,
  updateCategoryApi,
} from "@/services/api/category.api";
import type { CategoryFormValues, ListCategoriesParams } from "@/types/master";

export function useCategories(
  params: ListCategoriesParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => fetchCategories(params),
    placeholderData: (prev) => prev,
    enabled: options.enabled,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryFormValues) => createCategoryApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) =>
      updateCategoryApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategoryApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useRestoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreCategoryApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useSetCategoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setCategoryStatusApi(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previous = queryClient.getQueriesData({ queryKey: ["categories"] });
      queryClient.setQueriesData<
        { rows: { id: string; active: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["categories"] },
        (data) =>
          data && {
            ...data,
            rows: data.rows.map((row) => (row.id === id ? { ...row, active } : row)),
          },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
