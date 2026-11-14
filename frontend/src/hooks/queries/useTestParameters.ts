import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTestParameterApi,
  deleteTestParameterApi,
  fetchTestParameters,
  reorderTestParametersApi,
  updateTestParameterApi,
} from "@/services/api/testParameterApi";
import type { TestParameterFormValues } from "@/types/test";

export function useTestParameters(testId: string | null) {
  return useQuery({
    queryKey: ["test-parameters", testId],
    queryFn: () => fetchTestParameters(testId as string),
    enabled: Boolean(testId),
  });
}

export function useCreateTestParameter(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TestParameterFormValues) => createTestParameterApi(testId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-parameters", testId] });
    },
  });
}

export function useUpdateTestParameter(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TestParameterFormValues }) =>
      updateTestParameterApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-parameters", testId] });
    },
  });
}

export function useDeleteTestParameter(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTestParameterApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-parameters", testId] });
    },
  });
}

export function useReorderTestParameters(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderTestParametersApi(testId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-parameters", testId] });
    },
  });
}
