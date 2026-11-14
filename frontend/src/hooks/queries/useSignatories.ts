import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSignatoryApi,
  deleteSignatoryApi,
  fetchSignatories,
  updateSignatoryApi,
  uploadSignatoryImageApi,
} from "@/services/api/signatoryApi";
import type { ListSignatoriesParams, SignatoryFormValues } from "@/types/signatory";

export function useSignatories(params: ListSignatoriesParams = {}) {
  return useQuery({
    queryKey: ["signatories", params],
    queryFn: () => fetchSignatories(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateSignatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SignatoryFormValues) => createSignatoryApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signatories"] }),
  });
}

export function useUpdateSignatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SignatoryFormValues }) =>
      updateSignatoryApi(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signatories"] }),
  });
}

export function useDeleteSignatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSignatoryApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signatories"] }),
  });
}

export function useUploadSignatoryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadSignatoryImageApi(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signatories"] }),
  });
}
