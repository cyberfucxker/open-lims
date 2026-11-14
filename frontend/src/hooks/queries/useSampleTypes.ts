import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSampleTypeApi,
  deleteSampleTypeApi,
  fetchSampleTypes,
  restoreSampleTypeApi,
  setSampleTypeStatusApi,
  updateSampleTypeApi,
} from "@/services/api/sampleType.api";
import type { ListMasterParams, SampleTypeFormValues } from "@/types/master";

export function useSampleTypes(params: ListMasterParams = {}) {
  return useQuery({
    queryKey: ["sampleTypes", params],
    queryFn: () => fetchSampleTypes(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateSampleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SampleTypeFormValues) => createSampleTypeApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sampleTypes"] });
    },
  });
}

export function useUpdateSampleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SampleTypeFormValues }) =>
      updateSampleTypeApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sampleTypes"] });
    },
  });
}

export function useDeleteSampleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSampleTypeApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sampleTypes"] });
    },
  });
}

export function useRestoreSampleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreSampleTypeApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sampleTypes"] });
    },
  });
}

export function useSetSampleTypeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setSampleTypeStatusApi(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ["sampleTypes"] });
      const previous = queryClient.getQueriesData({ queryKey: ["sampleTypes"] });
      queryClient.setQueriesData<
        { rows: { id: string; active: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["sampleTypes"] },
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
      queryClient.invalidateQueries({ queryKey: ["sampleTypes"] });
    },
  });
}
