import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export interface PhlebotomistDto {
  id: string;
  name: string;
  mobile: string;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cityId: string | null;
  cityName: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  serviceAreas: Array<{ id: string; name: string }>;
}

/** Unpaginated, active-only — exactly for populating the assign-phlebo dropdown
 * (`GET /phlebotomists/active`). */
export async function fetchActivePhlebotomists(): Promise<PhlebotomistDto[]> {
  const response = await httpClient.get<ApiResponseBody<PhlebotomistDto[]>>(
    "/phlebotomists/active",
    { suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistDto[];
}

export interface PhlebotomistListParams {
  search?: string;
  isActive?: boolean;
  cityId?: string;
  page?: number;
  pageSize?: number;
}

export interface PhlebotomistFormValues {
  name: string;
  mobile: string;
  photoUrl?: string | null;
  isActive?: boolean;
  cityId?: string | null;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  serviceAreaIds?: string[];
}

export async function fetchPhlebotomists(
  params: PhlebotomistListParams = {},
): Promise<PaginatedResult<PhlebotomistDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<PhlebotomistDto>>>(
    "/phlebotomists",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<PhlebotomistDto>;
}

export async function fetchPhlebotomistById(id: string): Promise<PhlebotomistDto> {
  const response = await httpClient.get<ApiResponseBody<PhlebotomistDto>>(`/phlebotomists/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as PhlebotomistDto;
}

/** The Phlebotomist Profile page's stats block — see backend's
 *  `getPhlebotomistStats` doc-comment for exactly what's derived live from
 *  orders vs. genuinely not tracked yet (ratings/payouts/attendance). */
export interface PhlebotomistStatsDto {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  completionRate: number;
  codCollectedTotal: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
}

export async function fetchPhlebotomistStats(id: string): Promise<PhlebotomistStatsDto> {
  const response = await httpClient.get<ApiResponseBody<PhlebotomistStatsDto>>(
    `/phlebotomists/${id}/stats`,
    { suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistStatsDto;
}

export async function createPhlebotomistApi(
  values: PhlebotomistFormValues,
): Promise<PhlebotomistDto> {
  const response = await httpClient.post<ApiResponseBody<PhlebotomistDto>>(
    "/phlebotomists",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistDto;
}

export async function updatePhlebotomistApi(
  id: string,
  values: PhlebotomistFormValues,
): Promise<PhlebotomistDto> {
  const response = await httpClient.put<ApiResponseBody<PhlebotomistDto>>(
    `/phlebotomists/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistDto;
}

export async function setPhlebotomistStatusApi(
  id: string,
  isActive: boolean,
): Promise<PhlebotomistDto> {
  const response = await httpClient.patch<ApiResponseBody<PhlebotomistDto>>(
    `/phlebotomists/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistDto;
}

export async function deletePhlebotomistApi(id: string): Promise<void> {
  await httpClient.delete(`/phlebotomists/${id}`, { suppressErrorToast: true });
}
