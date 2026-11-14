import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListTestResultConfigsParams,
  ListTestResultConfigsResult,
  TestResultConfig,
  TestResultConfigFormValues,
} from "@/types/master";

export async function fetchTestResultConfigs(
  params: ListTestResultConfigsParams = {},
): Promise<ListTestResultConfigsResult> {
  const response = await httpClient.get<ApiResponseBody<ListTestResultConfigsResult>>(
    "/test-result-configs",
    {
      params,
    },
  );
  return response.data.data as ListTestResultConfigsResult;
}

export async function upsertTestResultConfigApi(
  testId: string,
  values: TestResultConfigFormValues,
): Promise<TestResultConfig> {
  const response = await httpClient.put<ApiResponseBody<TestResultConfig>>(
    `/test-result-configs/${testId}`,
    values,
  );
  return response.data.data as TestResultConfig;
}
