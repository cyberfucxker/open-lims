import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAppCategoryApi,
  deleteAppCategoryApi,
  fetchAppCategories,
  reorderAppCategoriesApi,
  setAppCategoryStatusApi,
  updateAppCategoryApi,
  type AppCategoryFormValues,
  type AppCategoryListParams,
} from "@/services/api/appCategoryApi";

export function useAppCategories(params: AppCategoryListParams) {
  return useQuery({
    queryKey: ["app-categories", "list", params],
    queryFn: () => fetchAppCategories(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateAppCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["app-categories", "list"] });
}

export function useCreateAppCategory() {
  const invalidate = useInvalidateAppCategories();
  return useMutation({
    mutationFn: (values: AppCategoryFormValues) => createAppCategoryApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateAppCategory() {
  const invalidate = useInvalidateAppCategories();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AppCategoryFormValues }) =>
      updateAppCategoryApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetAppCategoryStatus() {
  const invalidate = useInvalidateAppCategories();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAppCategoryStatusApi(id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteAppCategory() {
  const invalidate = useInvalidateAppCategories();
  return useMutation({
    mutationFn: (id: string) => deleteAppCategoryApi(id),
    onSuccess: invalidate,
  });
}

export function useReorderAppCategories() {
  const invalidate = useInvalidateAppCategories();
  return useMutation({
    mutationFn: (ids: string[]) => reorderAppCategoriesApi(ids),
    onSuccess: invalidate,
  });
}
