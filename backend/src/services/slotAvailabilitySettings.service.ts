import * as repo from "../repositories/slotAvailabilitySettings.repository";
import type { SlotAvailabilitySettingsWriteData } from "../repositories/slotAvailabilitySettings.repository";
import type { SlotAvailabilitySettingsDto } from "../types/slotAvailabilitySettings.types";

function toDto(row: {
  checkCityConfigured: boolean;
  checkHoliday: boolean;
  checkAreaResolved: boolean;
  checkAreaBlock: boolean;
  checkSlotBlock: boolean;
  checkPhlebotomistCoverage: boolean;
  checkCapacity: boolean;
  updatedAt: Date;
}): SlotAvailabilitySettingsDto {
  return {
    checkCityConfigured: row.checkCityConfigured,
    checkHoliday: row.checkHoliday,
    checkAreaResolved: row.checkAreaResolved,
    checkAreaBlock: row.checkAreaBlock,
    checkSlotBlock: row.checkSlotBlock,
    checkPhlebotomistCoverage: row.checkPhlebotomistCoverage,
    checkCapacity: row.checkCapacity,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSlotAvailabilitySettings(): Promise<SlotAvailabilitySettingsDto> {
  const row = await repo.getOrCreateSlotAvailabilitySettings();
  return toDto(row);
}

export async function updateSlotAvailabilitySettings(
  data: SlotAvailabilitySettingsWriteData,
): Promise<SlotAvailabilitySettingsDto> {
  const row = await repo.updateSlotAvailabilitySettings(data);
  return toDto(row);
}
