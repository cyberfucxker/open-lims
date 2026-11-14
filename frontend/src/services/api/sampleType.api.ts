import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListMasterParams,
  ListSampleTypesResult,
  SampleType,
  SampleTypeFormValues,
} from "@/types/master";

export async function fetchSampleTypes(
  params: ListMasterParams = {},
): Promise<ListSampleTypesResult> {
  const response = await httpClient.get<ApiResponseBody<ListSampleTypesResult>>("/sample-types", {
    params,
  });
  return response.data.data as ListSampleTypesResult;
}

export async function fetchSampleType(id: string): Promise<SampleType> {
  const response = await httpClient.get<ApiResponseBody<SampleType>>(`/sample-types/${id}`);
  return response.data.data as SampleType;
}

export async function createSampleTypeApi(values: SampleTypeFormValues): Promise<SampleType> {
  const response = await httpClient.post<ApiResponseBody<SampleType>>("/sample-types", values);
  return response.data.data as SampleType;
}

export async function updateSampleTypeApi(
  id: string,
  values: SampleTypeFormValues,
): Promise<SampleType> {
  const response = await httpClient.put<ApiResponseBody<SampleType>>(`/sample-types/${id}`, values);
  return response.data.data as SampleType;
}

export async function deleteSampleTypeApi(id: string): Promise<void> {
  await httpClient.delete(`/sample-types/${id}`);
}

export async function restoreSampleTypeApi(id: string): Promise<SampleType> {
  const response = await httpClient.patch<ApiResponseBody<SampleType>>(
    `/sample-types/${id}/restore`,
  );
  return response.data.data as SampleType;
}

export async function setSampleTypeStatusApi(id: string, active: boolean): Promise<SampleType> {
  const response = await httpClient.patch<ApiResponseBody<SampleType>>(
    `/sample-types/${id}/status`,
    { active },
  );
  return response.data.data as SampleType;
}
