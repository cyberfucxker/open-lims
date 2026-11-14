import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListTestSampleRulesParams,
  ListTestSampleRulesResult,
  TestSampleRule,
  TestSampleRuleFormValues,
} from "@/types/master";

export async function fetchTestSampleRules(
  params: ListTestSampleRulesParams = {},
): Promise<ListTestSampleRulesResult> {
  const response = await httpClient.get<ApiResponseBody<ListTestSampleRulesResult>>(
    "/test-sample-rules",
    { params },
  );
  return response.data.data as ListTestSampleRulesResult;
}

export async function fetchTestSampleRule(testId: string): Promise<TestSampleRule> {
  const response = await httpClient.get<ApiResponseBody<TestSampleRule>>(
    `/test-sample-rules/${testId}`,
  );
  return response.data.data as TestSampleRule;
}

export async function upsertTestSampleRuleApi(
  testId: string,
  values: TestSampleRuleFormValues,
): Promise<TestSampleRule> {
  const response = await httpClient.put<ApiResponseBody<TestSampleRule>>(
    `/test-sample-rules/${testId}`,
    values,
  );
  return response.data.data as TestSampleRule;
}
