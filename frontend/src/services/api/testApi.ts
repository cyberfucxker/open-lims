import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { LabTest, ListTestsParams, ListTestsResult, TestFormValues } from "@/types/test";

/** Real `/tests` endpoints. Param names mirror the mock service so a
 *  backend that follows the same convention needs no frontend changes. */
export async function fetchTests(params: ListTestsParams = {}): Promise<ListTestsResult> {
  const response = await httpClient.get<ApiResponseBody<ListTestsResult>>("/tests", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListTestsResult;
}

export async function fetchTest(id: string): Promise<LabTest> {
  const response = await httpClient.get<ApiResponseBody<LabTest>>(`/tests/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as LabTest;
}

export async function createTestApi(values: TestFormValues): Promise<LabTest> {
  const response = await httpClient.post<ApiResponseBody<LabTest>>("/tests", values, {
    suppressErrorToast: true,
  });
  return response.data.data as LabTest;
}

export async function updateTestApi(id: string, values: TestFormValues): Promise<LabTest> {
  const response = await httpClient.patch<ApiResponseBody<LabTest>>(`/tests/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as LabTest;
}

export async function deleteTestApi(id: string): Promise<void> {
  await httpClient.delete(`/tests/${id}`, { suppressErrorToast: true });
}
