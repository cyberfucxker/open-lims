import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface HomeFaqDto {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeFaqListParams {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface HomeFaqFormValues {
  question: string;
  answer: string;
  isActive?: boolean;
}

export async function fetchHomeFaqs(
  params: HomeFaqListParams = {},
): Promise<PaginatedResult<HomeFaqDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<HomeFaqDto>>>(
    "/home-faqs",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<HomeFaqDto>;
}

export async function createHomeFaqApi(values: HomeFaqFormValues): Promise<HomeFaqDto> {
  const response = await httpClient.post<ApiResponseBody<HomeFaqDto>>("/home-faqs", values, {
    suppressErrorToast: true,
  });
  return response.data.data as HomeFaqDto;
}

export async function updateHomeFaqApi(id: string, values: HomeFaqFormValues): Promise<HomeFaqDto> {
  const response = await httpClient.put<ApiResponseBody<HomeFaqDto>>(`/home-faqs/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as HomeFaqDto;
}

export async function setHomeFaqStatusApi(id: string, isActive: boolean): Promise<HomeFaqDto> {
  const response = await httpClient.patch<ApiResponseBody<HomeFaqDto>>(
    `/home-faqs/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as HomeFaqDto;
}

export async function deleteHomeFaqApi(id: string): Promise<void> {
  await httpClient.delete(`/home-faqs/${id}`, { suppressErrorToast: true });
}

export async function reorderHomeFaqsApi(ids: string[]): Promise<void> {
  await httpClient.patch("/home-faqs/reorder", { ids }, { suppressErrorToast: true });
}
