import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { callWithFallback } from "@/services/api/callWithFallback";
import { createPatientApi, fetchPatients } from "@/services/api/patientApi";
import { createPatient, listPatients } from "@/services/mock/patientService";
import type { ListPatientsParams, PatientFormValues } from "@/types/patient";

export function usePatients(params: ListPatientsParams) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () =>
      callWithFallback(
        () => fetchPatients(params),
        () => listPatients(params),
      ),
    placeholderData: (prev) => prev,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, testIds }: { values: PatientFormValues; testIds: string[] }) =>
      callWithFallback(
        () => createPatientApi(values, testIds),
        () => createPatient(values, testIds),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
