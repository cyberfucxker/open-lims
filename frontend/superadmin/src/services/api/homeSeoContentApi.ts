import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface HomeSeoContentDto {
  heading: string;
  body: string;
  updatedAt: string;
}

export interface HomeSeoContentFormValues {
  heading: string;
  body: string;
}

export async function fetchHomeSeoContent(): Promise<HomeSeoContentDto> {
  const response = await httpClient.get<ApiResponseBody<HomeSeoContentDto>>("/home-seo-content", {
    suppressErrorToast: true,
  });
  return response.data.data as HomeSeoContentDto;
}

export async function updateHomeSeoContentApi(
  values: HomeSeoContentFormValues,
): Promise<HomeSeoContentDto> {
  const response = await httpClient.put<ApiResponseBody<HomeSeoContentDto>>(
    "/home-seo-content",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as HomeSeoContentDto;
}
