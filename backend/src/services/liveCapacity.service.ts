import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { getCityDaySlots, type DaySlotResult } from "./slotAvailability.service";

export interface LiveCapacityAreaResult {
  areaId: string;
  areaName: string;
  slots: DaySlotResult[];
}

export async function getLiveCapacity(
  cityId: string,
  date: string,
): Promise<LiveCapacityAreaResult[]> {
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) {
    throw ApiError.notFound("City not found");
  }

  const areas = await prisma.area.findMany({
    where: { cityId, isActive: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    areas.map(async (area) => ({
      areaId: area.id,
      areaName: area.name,
      slots: await getCityDaySlots({ cityId, areaId: area.id, date }),
    })),
  );
}
