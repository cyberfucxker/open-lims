import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { TestParameter, TestParameterFormValues } from "@/types/test";

export async function fetchTestParameters(testId: string): Promise<TestParameter[]> {
  const response = await httpClient.get<ApiResponseBody<TestParameter[]>>(
    `/test-parameters/${testId}`,
    { suppressErrorToast: true },
  );
  return response.data.data as TestParameter[];
}

export async function createTestParameterApi(
  testId: string,
  values: TestParameterFormValues,
): Promise<TestParameter> {
  const response = await httpClient.post<ApiResponseBody<TestParameter>>(
    `/test-parameters/${testId}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as TestParameter;
}

export async function updateTestParameterApi(
  id: string,
  values: TestParameterFormValues,
): Promise<TestParameter> {
  const response = await httpClient.patch<ApiResponseBody<TestParameter>>(
    `/test-parameters/item/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as TestParameter;
}

export async function deleteTestParameterApi(id: string): Promise<void> {
  await httpClient.delete(`/test-parameters/item/${id}`, { suppressErrorToast: true });
}

export async function reorderTestParametersApi(
  testId: string,
  orderedIds: string[],
): Promise<TestParameter[]> {
  const response = await httpClient.patch<ApiResponseBody<TestParameter[]>>(
    `/test-parameters/${testId}/reorder`,
    { orderedIds },
    { suppressErrorToast: true },
  );
  return response.data.data as TestParameter[];
}
