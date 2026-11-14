import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { prescriptionApi } from "@/services/api/prescriptionApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { SubmitPrescriptionRequest } from "@/types";

export const PRESCRIPTIONS_QUERY_KEY = ["prescriptions"];

export function usePrescriptions() {
  return useQuery({ queryKey: PRESCRIPTIONS_QUERY_KEY, queryFn: prescriptionApi.list });
}

export function useSubmitPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitPrescriptionRequest) => prescriptionApi.submit(payload),
    onSuccess: () => {
      toast.success("Prescription submitted");
      queryClient.invalidateQueries({ queryKey: PRESCRIPTIONS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError ? error.message : "Could not submit prescription",
      );
    },
  });
}

export function useRemovePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => prescriptionApi.remove(id),
    onSuccess: () => {
      toast.success("Prescription removed");
      queryClient.invalidateQueries({ queryKey: PRESCRIPTIONS_QUERY_KEY });
    },
    onError: () => toast.error("Could not remove prescription"),
  });
}
