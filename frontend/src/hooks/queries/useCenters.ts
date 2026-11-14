import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCenterApi,
  deleteCenterApi,
  fetchActiveCenters,
  fetchCenters,
  restoreCenterApi,
  setCenterStatusApi,
  updateCenterApi,
} from "@/services/api/center.api";
import type { CenterFormValues, ListMasterParams } from "@/types/master";

export function useCenters(params: ListMasterParams = {}) {
  return useQuery({
    queryKey: ["centers", params],
    queryFn: () => fetchCenters(params),
    placeholderData: (prev) => prev,
  });
}

/** Active-only, unpaginated — for the Collection Center picker on Patient
 *  Registration (and anywhere else that just needs "which centers can I
 *  pick from right now"). */
export function useActiveCenters() {
  return useQuery({
    queryKey: ["centers", "active"],
    queryFn: fetchActiveCenters,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CenterFormValues) => createCenterApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useUpdateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CenterFormValues }) =>
      updateCenterApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useDeleteCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCenterApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useRestoreCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreCenterApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useSetCenterStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setCenterStatusApi(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ["centers"] });
      const previous = queryClient.getQueriesData({ queryKey: ["centers"] });
      queryClient.setQueriesData<
        { rows: { id: string; active: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["centers"] },
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
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}
