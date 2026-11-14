import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export type CmsAppType = "USER" | "PHLEBO";
export type CmsPageStatus = "DRAFT" | "PUBLISHED";

/** Mirrors the backend's `CmsPageDto` (GET /cms-pages/:id). */
export interface CmsPage {
  id: string;
  appType: CmsAppType;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: CmsPageStatus;
  publicUrl: string;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Slim row shape from `GET /cms-pages` — omits `content`. */
export interface CmsPageListItem {
  id: string;
  appType: CmsAppType;
  title: string;
  slug: string;
  metaTitle: string | null;
  status: CmsPageStatus;
  publicUrl: string;
  updatedAt: string;
}

export interface CmsPageListParams {
  appType?: CmsAppType;
  status?: CmsPageStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CmsPageFormValues {
  appType: CmsAppType;
  title: string;
  slug?: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  status?: CmsPageStatus;
}

export async function fetchCmsPages(
  params: CmsPageListParams = {},
): Promise<PaginatedResult<CmsPageListItem>> {
  const { status, ...rest } = params;
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<CmsPageListItem>>>(
    "/cms-pages",
    {
      params: { ...rest, status: status && status !== "all" ? status : undefined },
      suppressErrorToast: true,
    },
  );
  return response.data.data as PaginatedResult<CmsPageListItem>;
}

export async function fetchCmsPage(id: string): Promise<CmsPage> {
  const response = await httpClient.get<ApiResponseBody<CmsPage>>(`/cms-pages/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as CmsPage;
}

export async function createCmsPageApi(values: CmsPageFormValues): Promise<CmsPage> {
  const response = await httpClient.post<ApiResponseBody<CmsPage>>("/cms-pages", values, {
    suppressErrorToast: true,
  });
  return response.data.data as CmsPage;
}

export async function updateCmsPageApi(id: string, values: CmsPageFormValues): Promise<CmsPage> {
  const response = await httpClient.put<ApiResponseBody<CmsPage>>(`/cms-pages/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as CmsPage;
}

export async function setCmsPageStatusApi(id: string, status: CmsPageStatus): Promise<CmsPage> {
  const response = await httpClient.patch<ApiResponseBody<CmsPage>>(
    `/cms-pages/${id}/status`,
    { status },
    { suppressErrorToast: true },
  );
  return response.data.data as CmsPage;
}

export async function duplicateCmsPageApi(id: string): Promise<CmsPage> {
  const response = await httpClient.post<ApiResponseBody<CmsPage>>(
    `/cms-pages/${id}/duplicate`,
    undefined,
    { suppressErrorToast: true },
  );
  return response.data.data as CmsPage;
}

export async function deleteCmsPageApi(id: string): Promise<void> {
  await httpClient.delete(`/cms-pages/${id}`, { suppressErrorToast: true });
}

/** Uploads an image inserted into a page's rich text content, returns the
 * backend-relative `/uploads/...` path to embed as the `<img src>`. */
export async function uploadCmsImageApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await httpClient.post<ApiResponseBody<{ url: string }>>(
    "/cms-pages/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return (response.data.data as { url: string }).url;
}
