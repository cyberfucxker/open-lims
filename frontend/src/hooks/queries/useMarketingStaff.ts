import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMarketingStaffApi,
  deleteMarketingStaffApi,
  fetchMarketingStaff,
  restoreMarketingStaffApi,
  setMarketingStaffStatusApi,
  updateMarketingStaffApi,
} from "@/services/api/marketingStaff.api";
import type { ListMarketingStaffParams, MarketingStaffFormValues } from "@/types/marketingStaff";

export function useMarketingStaff(params: ListMarketingStaffParams = {}) {
  return useQuery({
    queryKey: ["marketingStaff", params],
    queryFn: () => fetchMarketingStaff(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateMarketingStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MarketingStaffFormValues) => createMarketingStaffApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingStaff"] });
    },
  });
}

export function useUpdateMarketingStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MarketingStaffFormValues }) =>
      updateMarketingStaffApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingStaff"] });
    },
  });
}

export function useDeleteMarketingStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMarketingStaffApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingStaff"] });
    },
  });
}

export function useRestoreMarketingStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreMarketingStaffApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingStaff"] });
    },
  });
}

export function useSetMarketingStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      setMarketingStaffStatusApi(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["marketingStaff"] });
      const previous = queryClient.getQueriesData({ queryKey: ["marketingStaff"] });
      queryClient.setQueriesData<
        { rows: { id: string; status: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["marketingStaff"] },
        (data) =>
          data && {
            ...data,
            rows: data.rows.map((row) => (row.id === id ? { ...row, status } : row)),
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
      queryClient.invalidateQueries({ queryKey: ["marketingStaff"] });
    },
  });
}
