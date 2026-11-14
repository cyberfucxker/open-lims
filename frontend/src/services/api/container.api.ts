import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  Container,
  ContainerFormValues,
  ListContainersResult,
  ListMasterParams,
} from "@/types/master";

export async function fetchContainers(
  params: ListMasterParams = {},
): Promise<ListContainersResult> {
  const response = await httpClient.get<ApiResponseBody<ListContainersResult>>("/containers", {
    params,
  });
  return response.data.data as ListContainersResult;
}

export async function fetchContainer(id: string): Promise<Container> {
  const response = await httpClient.get<ApiResponseBody<Container>>(`/containers/${id}`);
  return response.data.data as Container;
}

export async function createContainerApi(values: ContainerFormValues): Promise<Container> {
  const response = await httpClient.post<ApiResponseBody<Container>>("/containers", values);
  return response.data.data as Container;
}

export async function updateContainerApi(
  id: string,
  values: ContainerFormValues,
): Promise<Container> {
  const response = await httpClient.put<ApiResponseBody<Container>>(`/containers/${id}`, values);
  return response.data.data as Container;
}

export async function deleteContainerApi(id: string): Promise<void> {
  await httpClient.delete(`/containers/${id}`);
}

export async function restoreContainerApi(id: string): Promise<Container> {
  const response = await httpClient.patch<ApiResponseBody<Container>>(`/containers/${id}/restore`);
  return response.data.data as Container;
}

export async function setContainerStatusApi(id: string, active: boolean): Promise<Container> {
  const response = await httpClient.patch<ApiResponseBody<Container>>(`/containers/${id}/status`, {
    active,
  });
  return response.data.data as Container;
}
