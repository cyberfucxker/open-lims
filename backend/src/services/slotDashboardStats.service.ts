import { prisma } from "../config/database";
import { getCityDaySlots } from "./slotAvailability.service";

export interface SlotDashboardStats {
  totalCities: number;
  activeSlotTemplates: number;
  todaysBookings: number;
  blockedSlotsToday: number;
  availableCapacityToday: number;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getSlotDashboardStats(): Promise<SlotDashboardStats> {
  const today = todayDateString();
  const todayDate = new Date(today);

  const [
    totalCities,
    activeSlotTemplates,
    todaysBookings,
    slotBlocksToday,
    areaSlotBlocksToday,
    holidaysToday,
    cutoverCities,
  ] = await Promise.all([
    prisma.city.count({ where: { isActive: true } }),
    prisma.slotTemplate.count({ where: { active: true } }),
    prisma.appOrder.count({
      where: {
        orderDate: todayDate,
        slotTemplateId: { not: null },
        status: { notIn: ["CANCELLED"] },
        isDraft: false,
      },
    }),
    prisma.slotBlock.count({ where: { blockDate: todayDate } }),
    prisma.areaSlotBlock.count({ where: { blockDate: todayDate } }),
    prisma.holiday.findMany({ where: { holidayDate: todayDate }, select: { cityId: true } }),
    prisma.city.findMany({
      where: { useNewSlotSystem: true, isActive: true },
      include: { areas: { where: { isActive: true } } },
    }),
  ]);

  // Holiday-day blocks: every template assigned to a holiday city counts as blocked.
  const holidayCityIds = holidaysToday.map((h) => h.cityId);
  const holidayTemplateBlocks = holidayCityIds.length
    ? await prisma.citySlotTemplate.count({
        where: { cityId: { in: holidayCityIds }, isActive: true },
      })
    : 0;

  const blockedSlotsToday = slotBlocksToday + areaSlotBlocksToday + holidayTemplateBlocks;

  let availableCapacityToday = 0;
  for (const city of cutoverCities) {
    for (const area of city.areas) {
      const slots = await getCityDaySlots({ cityId: city.id, areaId: area.id, date: today });
      for (const slot of slots) {
        availableCapacityToday += Math.max(slot.capacity - slot.booked, 0);
      }
    }
  }

  return {
    totalCities,
    activeSlotTemplates,
    todaysBookings,
    blockedSlotsToday,
    availableCapacityToday,
  };
}
