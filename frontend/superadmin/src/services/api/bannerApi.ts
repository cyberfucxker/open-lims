import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface BannerDto {
  id: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerListParams {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BannerFormValues {
  imageUrl: string;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}

export async function fetchBanners(
  params: BannerListParams = {},
): Promise<PaginatedResult<BannerDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<BannerDto>>>("/banners", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as PaginatedResult<BannerDto>;
}

export async function createBannerApi(values: BannerFormValues): Promise<BannerDto> {
  const response = await httpClient.post<ApiResponseBody<BannerDto>>("/banners", values, {
    suppressErrorToast: true,
  });
  return response.data.data as BannerDto;
}

export async function updateBannerApi(id: string, values: BannerFormValues): Promise<BannerDto> {
  const response = await httpClient.put<ApiResponseBody<BannerDto>>(`/banners/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as BannerDto;
}

export async function setBannerStatusApi(id: string, isActive: boolean): Promise<BannerDto> {
  const response = await httpClient.patch<ApiResponseBody<BannerDto>>(
    `/banners/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as BannerDto;
}

export async function deleteBannerApi(id: string): Promise<void> {
  await httpClient.delete(`/banners/${id}`, { suppressErrorToast: true });
}

export async function reorderBannersApi(ids: string[]): Promise<void> {
  await httpClient.patch("/banners/reorder", { ids }, { suppressErrorToast: true });
}

/** Uploads a banner image file, returns the backend-relative `/uploads/...`
 * path to store on the banner record. */
export async function uploadBannerImageApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await httpClient.post<ApiResponseBody<{ url: string }>>(
    "/banners/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return (response.data.data as { url: string }).url;
}
