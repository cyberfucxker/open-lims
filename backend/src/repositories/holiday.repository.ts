import type { Holiday, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { HolidayDto } from "../types/holiday.types";

type HolidayWithCity = Holiday & { city: { name: string } };

export interface ListHolidaysFilter {
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface HolidayWriteInput {
  cityId: string;
  holidayDate: string;
  reason: string;
}

export function toHolidayDto(holiday: HolidayWithCity): HolidayDto {
  return {
    id: holiday.id,
    cityId: holiday.cityId,
    cityName: holiday.city.name,
    holidayDate: holiday.holidayDate.toISOString().slice(0, 10),
    reason: holiday.reason,
    createdAt: holiday.createdAt.toISOString(),
  };
}

const include = { city: { select: { name: true } } } satisfies Prisma.HolidayInclude;

export async function listHolidays(filter: ListHolidaysFilter): Promise<HolidayWithCity[]> {
  const where: Prisma.HolidayWhereInput = {};
  if (filter.cityId) where.cityId = filter.cityId;
  if (filter.dateFrom || filter.dateTo) {
    where.holidayDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  return prisma.holiday.findMany({ where, include, orderBy: { holidayDate: "asc" } });
}

export function createHoliday(data: HolidayWriteInput) {
  return prisma.holiday.create({
    data: { ...data, holidayDate: new Date(data.holidayDate) },
    include,
  });
}

export function deleteHoliday(id: string) {
  return prisma.holiday.delete({ where: { id } });
}
