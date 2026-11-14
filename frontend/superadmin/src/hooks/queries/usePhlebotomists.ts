import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPhlebotomistApi,
  deletePhlebotomistApi,
  fetchActivePhlebotomists,
  fetchPhlebotomistById,
  fetchPhlebotomists,
  fetchPhlebotomistStats,
  setPhlebotomistStatusApi,
  updatePhlebotomistApi,
  type PhlebotomistFormValues,
  type PhlebotomistListParams,
} from "@/services/api/phlebotomistApi";

export function usePhlebotomists() {
  return useQuery({
    queryKey: ["phlebotomists", "active"],
    queryFn: fetchActivePhlebotomists,
  });
}

export function usePhlebotomistsList(params: PhlebotomistListParams) {
  return useQuery({
    queryKey: ["phlebotomists", "list", params],
    queryFn: () => fetchPhlebotomists(params),
    placeholderData: (prev) => prev,
  });
}

export function usePhlebotomist(id: string | undefined) {
  return useQuery({
    queryKey: ["phlebotomists", "detail", id],
    queryFn: () => fetchPhlebotomistById(id as string),
    enabled: Boolean(id),
  });
}

export function usePhlebotomistStats(id: string | undefined) {
  return useQuery({
    queryKey: ["phlebotomists", "stats", id],
    queryFn: () => fetchPhlebotomistStats(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidatePhlebotomists() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["phlebotomists", "list"] });
    queryClient.invalidateQueries({ queryKey: ["phlebotomists", "active"] });
  };
}

export function useCreatePhlebotomist() {
  const invalidate = useInvalidatePhlebotomists();
  return useMutation({
    mutationFn: (values: PhlebotomistFormValues) => createPhlebotomistApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdatePhlebotomist() {
  const invalidate = useInvalidatePhlebotomists();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PhlebotomistFormValues }) =>
      updatePhlebotomistApi(id, values),
    onSuccess: (_data, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["phlebotomists", "detail", id] });
    },
  });
}

export function useSetPhlebotomistStatus() {
  const invalidate = useInvalidatePhlebotomists();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setPhlebotomistStatusApi(id, isActive),
    onSuccess: (_data, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["phlebotomists", "detail", id] });
    },
  });
}

export function useDeletePhlebotomist() {
  const invalidate = useInvalidatePhlebotomists();
  return useMutation({
    mutationFn: (id: string) => deletePhlebotomistApi(id),
    onSuccess: invalidate,
  });
}
