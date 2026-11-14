import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchPrescriptions,
  setPrescriptionStatusApi,
  type PrescriptionListParams,
  type PrescriptionStatus,
} from "@/services/api/prescriptionApi";

export function usePrescriptions(params: PrescriptionListParams) {
  return useQuery({
    queryKey: ["prescriptions", params],
    queryFn: () => fetchPrescriptions(params),
    placeholderData: (prev) => prev,
  });
}

export function useSetPrescriptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: PrescriptionStatus;
      rejectionReason?: string;
    }) => setPrescriptionStatusApi(id, status, rejectionReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
}
