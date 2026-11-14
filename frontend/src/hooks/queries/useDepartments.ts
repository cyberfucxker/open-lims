import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDepartmentApi,
  deleteDepartmentApi,
  fetchDepartments,
  restoreDepartmentApi,
  setDepartmentStatusApi,
  updateDepartmentApi,
} from "@/services/api/department.api";
import type { DepartmentFormValues, ListMasterParams } from "@/types/master";

export function useDepartments(params: ListMasterParams = {}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => fetchDepartments(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: DepartmentFormValues) => createDepartmentApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DepartmentFormValues }) =>
      updateDepartmentApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartmentApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useRestoreDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreDepartmentApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useSetDepartmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setDepartmentStatusApi(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ["departments"] });
      const previous = queryClient.getQueriesData({ queryKey: ["departments"] });
      queryClient.setQueriesData<
        { rows: { id: string; active: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["departments"] },
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
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
