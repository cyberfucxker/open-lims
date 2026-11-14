import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTestApi, deleteTestApi, fetchTests, updateTestApi } from "@/services/api/testApi";
import type { ListTestsParams, TestFormValues } from "@/types/test";

export function useTests(params: ListTestsParams) {
  return useQuery({
    queryKey: ["tests", params],
    queryFn: () => fetchTests(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TestFormValues) => createTestApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TestFormValues }) =>
      updateTestApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTestApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}
