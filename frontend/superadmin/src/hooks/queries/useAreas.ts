import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAreaApi,
  deleteAreaApi,
  fetchAreaById,
  fetchAreas,
  setAreaPhlebotomyChargeApi,
  setAreaStatusApi,
  updateAreaApi,
  type AreaListParams,
  type AreaWriteData,
} from "@/services/api/areaApi";

export function useAreas(params: AreaListParams) {
  return useQuery({
    queryKey: ["areas", "list", params],
    queryFn: () => fetchAreas(params),
    placeholderData: (prev) => prev,
  });
}

export function useArea(id: string | undefined) {
  return useQuery({
    queryKey: ["areas", "detail", id],
    queryFn: () => fetchAreaById(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateAreas() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["areas", "list"] });
}

export function useCreateArea() {
  const invalidate = useInvalidateAreas();
  return useMutation({
    mutationFn: (values: AreaWriteData) => createAreaApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateArea() {
  const invalidate = useInvalidateAreas();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AreaWriteData }) =>
      updateAreaApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetAreaStatus() {
  const invalidate = useInvalidateAreas();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAreaStatusApi(id, isActive),
    onSuccess: invalidate,
  });
}

export function useSetAreaPhlebotomyCharge() {
  const invalidate = useInvalidateAreas();
  return useMutation({
    mutationFn: ({ id, phlebotomyCharge }: { id: string; phlebotomyCharge: number | null }) =>
      setAreaPhlebotomyChargeApi(id, phlebotomyCharge),
    onSuccess: invalidate,
  });
}

export function useDeleteArea() {
  const invalidate = useInvalidateAreas();
  return useMutation({
    mutationFn: (id: string) => deleteAreaApi(id),
    onSuccess: invalidate,
  });
}
