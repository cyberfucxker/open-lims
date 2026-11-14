import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface SlotSystemCityDto {
  id: string;
  name: string;
  stateName: string;
  useNewSlotSystem: boolean;
  /** Counted server-side — see citySlotConfig.repository.ts. */
  areaCount: number;
  serviceableAreaCount: number;
  phlebotomyCharge: number;
  /** The franchise whose price list drives this city's patient-app
   *  catalogue — see `City.parentOrganizationId` on the backend. Null = no
   *  parent set, app falls back to the full global catalogue. */
  parentOrganizationId: string | null;
  parentOrganizationName: string | null;
}

export interface CitySlotConfigTemplateRow {
  slotTemplateId: string;
  title: string;
  startTime: string;
  endTime: string;
  active: boolean;
  assigned: boolean;
}

export interface CitySlotConfigDto {
  cityId: string;
  cityName: string;
  useNewSlotSystem: boolean;
  templates: CitySlotConfigTemplateRow[];
}

export async function fetchSlotSystemCities(): Promise<SlotSystemCityDto[]> {
  const response = await httpClient.get<ApiResponseBody<SlotSystemCityDto[]>>(
    "/city-slot-config/cities",
    { suppressErrorToast: true },
  );
  return response.data.data as SlotSystemCityDto[];
}

export async function fetchCitySlotConfig(cityId: string): Promise<CitySlotConfigDto> {
  const response = await httpClient.get<ApiResponseBody<CitySlotConfigDto>>("/city-slot-config", {
    params: { cityId },
    suppressErrorToast: true,
  });
  return response.data.data as CitySlotConfigDto;
}

export async function assignCitySlotTemplatesApi(
  cityId: string,
  slotTemplateIds: string[],
): Promise<CitySlotConfigDto> {
  const response = await httpClient.post<ApiResponseBody<CitySlotConfigDto>>(
    "/city-slot-config",
    { cityId, slotTemplateIds },
    { suppressErrorToast: true },
  );
  return response.data.data as CitySlotConfigDto;
}

export async function setCityCutoverApi(
  cityId: string,
  useNewSlotSystem: boolean,
): Promise<CitySlotConfigDto> {
  const response = await httpClient.patch<ApiResponseBody<CitySlotConfigDto>>(
    `/city-slot-config/${cityId}/cutover`,
    { useNewSlotSystem },
    { suppressErrorToast: true },
  );
  return response.data.data as CitySlotConfigDto;
}

export async function setCityPhlebotomyChargeApi(
  cityId: string,
  phlebotomyCharge: number,
): Promise<SlotSystemCityDto[]> {
  const response = await httpClient.patch<ApiResponseBody<SlotSystemCityDto[]>>(
    `/city-slot-config/${cityId}/phlebotomy-charge`,
    { phlebotomyCharge },
    { suppressErrorToast: true },
  );
  return response.data.data as SlotSystemCityDto[];
}

/** Sets (or clears, with `organizationId: null`) the franchise whose price
 *  list drives this city's patient-app catalogue. */
export async function setCityParentOrganizationApi(
  cityId: string,
  organizationId: string | null,
): Promise<SlotSystemCityDto[]> {
  const response = await httpClient.patch<ApiResponseBody<SlotSystemCityDto[]>>(
    `/city-slot-config/${cityId}/parent-organization`,
    { organizationId },
    { suppressErrorToast: true },
  );
  return response.data.data as SlotSystemCityDto[];
}
