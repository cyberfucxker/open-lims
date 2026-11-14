import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface AppCategoryDto {
  id: string;
  name: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppCategoryListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AppCategoryFormValues {
  name: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
}

export async function fetchAppCategories(
  params: AppCategoryListParams = {},
): Promise<PaginatedResult<AppCategoryDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<AppCategoryDto>>>(
    "/app-categories",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<AppCategoryDto>;
}

export async function createAppCategoryApi(values: AppCategoryFormValues): Promise<AppCategoryDto> {
  const response = await httpClient.post<ApiResponseBody<AppCategoryDto>>(
    "/app-categories",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as AppCategoryDto;
}

export async function updateAppCategoryApi(
  id: string,
  values: AppCategoryFormValues,
): Promise<AppCategoryDto> {
  const response = await httpClient.put<ApiResponseBody<AppCategoryDto>>(
    `/app-categories/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as AppCategoryDto;
}

export async function setAppCategoryStatusApi(
  id: string,
  isActive: boolean,
): Promise<AppCategoryDto> {
  const response = await httpClient.patch<ApiResponseBody<AppCategoryDto>>(
    `/app-categories/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as AppCategoryDto;
}

export async function deleteAppCategoryApi(id: string): Promise<void> {
  await httpClient.delete(`/app-categories/${id}`, { suppressErrorToast: true });
}

export async function reorderAppCategoriesApi(ids: string[]): Promise<void> {
  await httpClient.patch("/app-categories/reorder", { ids }, { suppressErrorToast: true });
}

/** Uploads a category/thumbnail image file, returns the backend-relative
 * `/uploads/...` path to store on the category record. */
export async function uploadAppCategoryImageApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await httpClient.post<ApiResponseBody<{ url: string }>>(
    "/app-categories/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return (response.data.data as { url: string }).url;
}
