import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignPriceListApi,
  createReferralSourceApi,
  deleteReferralSourceApi,
  fetchPriceListAssignment,
  fetchReferralSources,
  removePriceListApi,
  restoreReferralSourceApi,
  setReferralSourceStatusApi,
  updateReferralSourceApi,
} from "@/services/api/referralSource.api";
import type { ListReferralSourcesParams, ReferralSourceFormValues } from "@/types/referralSource";

export function useReferralSources(params: ListReferralSourcesParams = {}) {
  return useQuery({
    queryKey: ["referralSources", params],
    queryFn: () => fetchReferralSources(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateReferralSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReferralSourceFormValues) => createReferralSourceApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSources"] });
    },
  });
}

export function useUpdateReferralSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ReferralSourceFormValues }) =>
      updateReferralSourceApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSources"] });
    },
  });
}

export function useDeleteReferralSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReferralSourceApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSources"] });
    },
  });
}

export function useRestoreReferralSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreReferralSourceApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSources"] });
    },
  });
}

export function useSetReferralSourceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      setReferralSourceStatusApi(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["referralSources"] });
      const previous = queryClient.getQueriesData({ queryKey: ["referralSources"] });
      queryClient.setQueriesData<
        { rows: { id: string; status: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["referralSources"] },
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
      queryClient.invalidateQueries({ queryKey: ["referralSources"] });
    },
  });
}

export function useAssignPriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priceListId }: { id: string; priceListId: string }) =>
      assignPriceListApi(id, priceListId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSources"] });
    },
  });
}

export function useRemovePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removePriceListApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSources"] });
    },
  });
}

export function usePriceListAssignment(id: string | undefined) {
  return useQuery({
    queryKey: ["referralSources", "price-list", id],
    queryFn: () => fetchPriceListAssignment(id as string),
    enabled: !!id,
  });
}
