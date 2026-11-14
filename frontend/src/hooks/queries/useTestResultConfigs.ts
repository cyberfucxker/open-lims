import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchTestResultConfigs,
  upsertTestResultConfigApi,
} from "@/services/api/testResultConfig.api";
import type { ListTestResultConfigsParams, TestResultConfigFormValues } from "@/types/master";

export function useTestResultConfigs(params: ListTestResultConfigsParams = {}) {
  return useQuery({
    queryKey: ["testResultConfigs", params],
    queryFn: () => fetchTestResultConfigs(params),
    placeholderData: (prev) => prev,
  });
}

export function useUpsertTestResultConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, values }: { testId: string; values: TestResultConfigFormValues }) =>
      upsertTestResultConfigApi(testId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testResultConfigs"] });
    },
  });
}
