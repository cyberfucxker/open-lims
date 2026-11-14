import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface SlotAvailabilitySettingsDto {
  checkCityConfigured: boolean;
  checkHoliday: boolean;
  checkAreaResolved: boolean;
  checkAreaBlock: boolean;
  checkSlotBlock: boolean;
  checkPhlebotomistCoverage: boolean;
  checkCapacity: boolean;
  updatedAt: string;
}

export type SlotAvailabilitySettingsPatch = Partial<Omit<SlotAvailabilitySettingsDto, "updatedAt">>;

export async function fetchSlotAvailabilitySettings(): Promise<SlotAvailabilitySettingsDto> {
  const response = await httpClient.get<ApiResponseBody<SlotAvailabilitySettingsDto>>(
    "/slot-availability-settings",
    { suppressErrorToast: true },
  );
  return response.data.data as SlotAvailabilitySettingsDto;
}

export async function updateSlotAvailabilitySettingsApi(
  patch: SlotAvailabilitySettingsPatch,
): Promise<SlotAvailabilitySettingsDto> {
  const response = await httpClient.patch<ApiResponseBody<SlotAvailabilitySettingsDto>>(
    "/slot-availability-settings",
    patch,
    { suppressErrorToast: true },
  );
  return response.data.data as SlotAvailabilitySettingsDto;
}
