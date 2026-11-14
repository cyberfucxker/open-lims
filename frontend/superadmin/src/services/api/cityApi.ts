import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

/** The city MASTER record — name/state/visibility. Separate from
 *  `citySlotConfigApi.ts`'s `SlotSystemCityDto` (that one's read-only,
 *  enriched with area counts / slot-system / parent-franchise info for the
 *  Slot Management screens); this is the writable identity record itself,
 *  and the thing a new City add/edit/deactivate actually changes. Creating,
 *  editing, or deactivating one here triggers a live sitemap rebuild on the
 *  backend — see `sitemapGenerator.service.ts`. */
export interface CityDto {
  id: string;
  name: string;
  slug: string;
  stateId: string;
  stateName: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface CityFormValues {
  name: string;
  stateId: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface StateDto {
  id: string;
  name: string;
  code: string | null;
  /** Cities under it. A state with any cannot be deleted. */
  cityCount: number;
}

export interface StateFormValues {
  name: string;
  code?: string | null;
}

export interface ListCitiesParams {
  search?: string;
  active?: "true" | "false" | "all";
  page?: number;
  pageSize?: number;
}

export async function fetchCities(
  params: ListCitiesParams = {},
): Promise<PaginatedResult<CityDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<CityDto>>>("/cities", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as PaginatedResult<CityDto>;
}

export async function createCityApi(values: CityFormValues): Promise<CityDto> {
  const response = await httpClient.post<ApiResponseBody<CityDto>>("/cities", values, {
    suppressErrorToast: true,
  });
  return response.data.data as CityDto;
}

export async function updateCityApi(id: string, values: CityFormValues): Promise<CityDto> {
  const response = await httpClient.put<ApiResponseBody<CityDto>>(`/cities/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as CityDto;
}

export async function setCityStatusApi(id: string, active: boolean): Promise<CityDto> {
  const response = await httpClient.patch<ApiResponseBody<CityDto>>(
    `/cities/${id}/status`,
    { active },
    { suppressErrorToast: true },
  );
  return response.data.data as CityDto;
}

/** Seeded with India's states and editable from the States tab — a city can
 *  only be added for a state on this list, so a missing one has to be addable. */
export async function fetchStates(): Promise<StateDto[]> {
  const response = await httpClient.get<ApiResponseBody<StateDto[]>>("/states", {
    suppressErrorToast: true,
  });
  return response.data.data as StateDto[];
}

export async function createStateApi(values: StateFormValues): Promise<StateDto> {
  const response = await httpClient.post<ApiResponseBody<StateDto>>("/states", values, {
    suppressErrorToast: true,
  });
  return response.data.data as StateDto;
}

export async function updateStateApi(id: string, values: StateFormValues): Promise<StateDto> {
  const response = await httpClient.put<ApiResponseBody<StateDto>>(`/states/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as StateDto;
}

export async function deleteStateApi(id: string): Promise<void> {
  await httpClient.delete<ApiResponseBody<null>>(`/states/${id}`, { suppressErrorToast: true });
}
