import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

/** Ad landing pages — `/offer/<slug>` on the website. */

/** Where the public pages live; override per environment if needed. */
export const WEBSITE_ORIGIN =
  (import.meta.env.VITE_WEBSITE_ORIGIN as string | undefined) ?? "https://www.example.com";

export type LandingPageState = "LIVE" | "UPCOMING" | "EXPIRED" | "OFF";

export interface LandingPageDto {
  id: string;
  name: string;
  slug: string;
  title: string;
  city: { id: string; name: string; slug: string };
  desktopBannerUrl: string | null;
  mobileBannerUrl: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  state: LandingPageState;
  packages: Array<{ id: string; name: string; available: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageFormValues {
  name: string;
  /** Blank = derived from the name. */
  slug?: string;
  title: string;
  cityId: string;
  packageIds: string[];
  desktopBannerUrl: string | null;
  mobileBannerUrl: string | null;
  /** ISO timestamps. */
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export function landingPageUrl(slug: string): string {
  return `${WEBSITE_ORIGIN}/offer/${slug}`;
}

export async function fetchLandingPages(): Promise<LandingPageDto[]> {
  const response = await httpClient.get<ApiResponseBody<LandingPageDto[]>>("/landing-pages", {
    suppressErrorToast: true,
  });
  return response.data.data as LandingPageDto[];
}

export async function createLandingPageApi(values: LandingPageFormValues): Promise<LandingPageDto> {
  const response = await httpClient.post<ApiResponseBody<LandingPageDto>>(
    "/landing-pages",
    values,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as LandingPageDto;
}

export async function updateLandingPageApi(
  id: string,
  values: LandingPageFormValues,
): Promise<LandingPageDto> {
  const response = await httpClient.put<ApiResponseBody<LandingPageDto>>(
    `/landing-pages/${id}`,
    values,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as LandingPageDto;
}

export async function setLandingPageStatusApi(
  id: string,
  isActive: boolean,
): Promise<LandingPageDto> {
  const response = await httpClient.patch<ApiResponseBody<LandingPageDto>>(
    `/landing-pages/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as LandingPageDto;
}

export async function deleteLandingPageApi(id: string): Promise<void> {
  await httpClient.delete(`/landing-pages/${id}`, { suppressErrorToast: true });
}

export async function uploadLandingBannerApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await httpClient.post<ApiResponseBody<{ url: string }>>(
    "/landing-pages/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      suppressErrorToast: true,
    },
  );
  return (response.data.data as { url: string }).url;
}
