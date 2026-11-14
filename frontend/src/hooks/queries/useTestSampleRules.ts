import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchTestSampleRule,
  fetchTestSampleRules,
  upsertTestSampleRuleApi,
} from "@/services/api/testSampleRule.api";
import type { ListTestSampleRulesParams, TestSampleRuleFormValues } from "@/types/master";

export function useTestSampleRules(params: ListTestSampleRulesParams = {}) {
  return useQuery({
    queryKey: ["testSampleRules", params],
    queryFn: () => fetchTestSampleRules(params),
    placeholderData: (prev) => prev,
  });
}

export function useTestSampleRule(testId: string | null) {
  return useQuery({
    queryKey: ["testSampleRules", "detail", testId],
    queryFn: () => fetchTestSampleRule(testId as string),
    enabled: Boolean(testId),
  });
}

export function useUpsertTestSampleRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, values }: { testId: string; values: TestSampleRuleFormValues }) =>
      upsertTestSampleRuleApi(testId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testSampleRules"] });
    },
  });
}
