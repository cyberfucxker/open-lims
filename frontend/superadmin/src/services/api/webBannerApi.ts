import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

/** Website hero carousel (CMS > Web Banner). Separate from `bannerApi`,
 *  which drives the mobile app's image-only strip.
 *
 *  Note what is NOT here: price, MRP, discount, parameter count. Those are
 *  read live off the linked package when the site renders, so an admin can
 *  never save a banner that quotes a price the package card contradicts. */
/** Which masthead a banner belongs to. The two are separate lists — a HOME
 *  slide is artwork the home hero paints its own heading and search box over,
 *  a CITY slide is an image plus copy on a city landing page. */
export type WebBannerPlacement = "HOME" | "CITY";

export interface WebBannerDto {
  id: string;
  placement: WebBannerPlacement;
  badge: string | null;
  /** Null on a HOME banner, which carries no copy. */
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  packageId: string | null;
  packageName: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebBannerListParams {
  placement?: WebBannerPlacement;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface WebBannerFormValues {
  placement: WebBannerPlacement;
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  imageUrl: string;
  packageId?: string | null;
  linkUrl?: string | null;
  isActive?: boolean;
}

export async function fetchWebBanners(
  params: WebBannerListParams = {},
): Promise<PaginatedResult<WebBannerDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<WebBannerDto>>>(
    "/web-banners",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<WebBannerDto>;
}

export async function createWebBannerApi(values: WebBannerFormValues): Promise<WebBannerDto> {
  const response = await httpClient.post<ApiResponseBody<WebBannerDto>>("/web-banners", values, {
    suppressErrorToast: true,
  });
  return response.data.data as WebBannerDto;
}

export async function updateWebBannerApi(
  id: string,
  values: WebBannerFormValues,
): Promise<WebBannerDto> {
  const response = await httpClient.put<ApiResponseBody<WebBannerDto>>(
    `/web-banners/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as WebBannerDto;
}

export async function setWebBannerStatusApi(id: string, isActive: boolean): Promise<WebBannerDto> {
  const response = await httpClient.patch<ApiResponseBody<WebBannerDto>>(
    `/web-banners/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as WebBannerDto;
}

export async function deleteWebBannerApi(id: string): Promise<void> {
  await httpClient.delete(`/web-banners/${id}`, { suppressErrorToast: true });
}

export async function reorderWebBannersApi(ids: string[]): Promise<void> {
  await httpClient.patch("/web-banners/reorder", { ids }, { suppressErrorToast: true });
}

/** Same uploader and same `/uploads` store the app banners use. */
export async function uploadWebBannerImageApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await httpClient.post<ApiResponseBody<{ url: string }>>(
    "/web-banners/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return (response.data.data as { url: string }).url;
}
