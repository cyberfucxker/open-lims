import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchPatientRecord,
  fetchPatientRecordBarcode,
  fetchPatientRecords,
  registerPatientRecordApi,
} from "@/services/api/patientRecord.api";
import type { ListPatientRecordsParams, RegisterPatientRecordInput } from "@/types/patientRecord";

export function usePatientRecords(params: ListPatientRecordsParams = {}) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => fetchPatientRecords(params),
    placeholderData: (prev) => prev,
  });
}

export function usePatientRecord(id: string | undefined) {
  return useQuery({
    queryKey: ["patients", "detail", id],
    queryFn: () => fetchPatientRecord(id as string),
    enabled: !!id,
  });
}

export function usePatientRecordBarcode(id: string | undefined) {
  return useQuery({
    queryKey: ["patients", "barcode", id],
    queryFn: () => fetchPatientRecordBarcode(id as string),
    enabled: !!id,
  });
}

export function useRegisterPatientRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterPatientRecordInput) => registerPatientRecordApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
