import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { Center, CenterFormValues, ListCentersResult, ListMasterParams } from "@/types/master";

export async function fetchCenters(params: ListMasterParams = {}): Promise<ListCentersResult> {
  const response = await httpClient.get<ApiResponseBody<ListCentersResult>>("/centers", {
    params,
  });
  return response.data.data as ListCentersResult;
}

export async function fetchActiveCenters(): Promise<Center[]> {
  const response = await httpClient.get<ApiResponseBody<Center[]>>("/centers/active");
  return response.data.data as Center[];
}

export async function fetchCenter(id: string): Promise<Center> {
  const response = await httpClient.get<ApiResponseBody<Center>>(`/centers/${id}`);
  return response.data.data as Center;
}

export async function createCenterApi(values: CenterFormValues): Promise<Center> {
  const response = await httpClient.post<ApiResponseBody<Center>>("/centers", values);
  return response.data.data as Center;
}

export async function updateCenterApi(id: string, values: CenterFormValues): Promise<Center> {
  const response = await httpClient.put<ApiResponseBody<Center>>(`/centers/${id}`, values);
  return response.data.data as Center;
}

export async function deleteCenterApi(id: string): Promise<void> {
  await httpClient.delete(`/centers/${id}`);
}

export async function restoreCenterApi(id: string): Promise<Center> {
  const response = await httpClient.patch<ApiResponseBody<Center>>(`/centers/${id}/restore`);
  return response.data.data as Center;
}

export async function setCenterStatusApi(id: string, active: boolean): Promise<Center> {
  const response = await httpClient.patch<ApiResponseBody<Center>>(`/centers/${id}/status`, {
    active,
  });
  return response.data.data as Center;
}
