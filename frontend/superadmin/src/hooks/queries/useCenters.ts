import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCenterApi,
  deleteCenterApi,
  fetchCenters,
  setCenterStatusApi,
  updateCenterApi,
  type DiagnosticCenterFormValues,
  type DiagnosticCenterListParams,
} from "@/services/api/serviceCenterApi";

export function useCenters(params: DiagnosticCenterListParams) {
  return useQuery({
    queryKey: ["centers", params],
    queryFn: () => fetchCenters(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateCenters() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["centers"] });
    queryClient.invalidateQueries({ queryKey: ["service-centers"] });
  };
}

export function useCreateCenter() {
  const invalidate = useInvalidateCenters();
  return useMutation({
    mutationFn: (values: DiagnosticCenterFormValues) => createCenterApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateCenter() {
  const invalidate = useInvalidateCenters();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DiagnosticCenterFormValues }) =>
      updateCenterApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetCenterStatus() {
  const invalidate = useInvalidateCenters();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setCenterStatusApi(id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteCenter() {
  const invalidate = useInvalidateCenters();
  return useMutation({
    mutationFn: (id: string) => deleteCenterApi(id),
    onSuccess: invalidate,
  });
}
