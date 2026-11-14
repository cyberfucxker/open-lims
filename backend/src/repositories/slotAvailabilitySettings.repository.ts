import { prisma } from "../config/database";

const SINGLETON_ID = "default";

/** Same fixed-id upsert pattern as `reportSettings.repository.ts` — no seed
 *  needed, the first GET (or the first write) creates the all-`false` row. */
export function getOrCreateSlotAvailabilitySettings() {
  return prisma.slotAvailabilitySettings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export interface SlotAvailabilitySettingsWriteData {
  checkCityConfigured?: boolean;
  checkHoliday?: boolean;
  checkAreaResolved?: boolean;
  checkAreaBlock?: boolean;
  checkSlotBlock?: boolean;
  checkPhlebotomistCoverage?: boolean;
  checkCapacity?: boolean;
}

export function updateSlotAvailabilitySettings(data: SlotAvailabilitySettingsWriteData) {
  return prisma.slotAvailabilitySettings.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });
}
