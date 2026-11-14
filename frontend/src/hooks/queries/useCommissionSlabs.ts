import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCommissionSlabApi,
  deleteCommissionSlabApi,
  fetchCommissionSlabs,
  setCommissionSlabStatusApi,
  updateCommissionSlabApi,
} from "@/services/api/commissionSlab.api";
import type { CommissionSlabFormValues } from "@/types/commissionSlab";

export function useCommissionSlabs() {
  return useQuery({
    queryKey: ["commissionSlabs"],
    queryFn: () => fetchCommissionSlabs(),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCommissionSlab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CommissionSlabFormValues) => createCommissionSlabApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissionSlabs"] });
    },
  });
}

export function useUpdateCommissionSlab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CommissionSlabFormValues }) =>
      updateCommissionSlabApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissionSlabs"] });
    },
  });
}

export function useDeleteCommissionSlab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCommissionSlabApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissionSlabs"] });
    },
  });
}

export function useSetCommissionSlabStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setCommissionSlabStatusApi(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ["commissionSlabs"] });
      const previous = queryClient.getQueriesData({ queryKey: ["commissionSlabs"] });
      queryClient.setQueriesData<{ rows: { id: string; active: boolean }[] } | undefined>(
        { queryKey: ["commissionSlabs"] },
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
      queryClient.invalidateQueries({ queryKey: ["commissionSlabs"] });
    },
  });
}
