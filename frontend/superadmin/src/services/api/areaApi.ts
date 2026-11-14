import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface AreaDto {
  id: string;
  cityId: string;
  cityName: string;
  name: string;
  pincodes: string[];
  isActive: boolean;
  /** null = inherits the city's default phlebotomyCharge */
  phlebotomyCharge: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AreaListParams {
  cityId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AreaWriteData {
  cityId: string;
  name: string;
  pincodes?: string[];
  isActive?: boolean;
}

export async function fetchAreas(params: AreaListParams = {}): Promise<PaginatedResult<AreaDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<AreaDto>>>("/areas", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as PaginatedResult<AreaDto>;
}

export async function fetchAreaById(id: string): Promise<AreaDto> {
  const response = await httpClient.get<ApiResponseBody<AreaDto>>(`/areas/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as AreaDto;
}

export async function createAreaApi(values: AreaWriteData): Promise<AreaDto> {
  const response = await httpClient.post<ApiResponseBody<AreaDto>>("/areas", values, {
    suppressErrorToast: true,
  });
  return response.data.data as AreaDto;
}

export async function updateAreaApi(id: string, values: AreaWriteData): Promise<AreaDto> {
  const response = await httpClient.put<ApiResponseBody<AreaDto>>(`/areas/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as AreaDto;
}

export async function setAreaStatusApi(id: string, isActive: boolean): Promise<AreaDto> {
  const response = await httpClient.patch<ApiResponseBody<AreaDto>>(
    `/areas/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as AreaDto;
}

export async function setAreaPhlebotomyChargeApi(
  id: string,
  phlebotomyCharge: number | null,
): Promise<AreaDto> {
  const response = await httpClient.patch<ApiResponseBody<AreaDto>>(
    `/areas/${id}/phlebotomy-charge`,
    { phlebotomyCharge },
    { suppressErrorToast: true },
  );
  return response.data.data as AreaDto;
}

export async function deleteAreaApi(id: string): Promise<void> {
  await httpClient.delete(`/areas/${id}`, { suppressErrorToast: true });
}
