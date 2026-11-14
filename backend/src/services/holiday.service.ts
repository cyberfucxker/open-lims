import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as holidayRepository from "../repositories/holiday.repository";
import { toHolidayDto, type HolidayWriteInput } from "../repositories/holiday.repository";
import type { HolidayDto, ListHolidaysParams } from "../types/holiday.types";

export async function listHolidays(params: ListHolidaysParams): Promise<HolidayDto[]> {
  const rows = await holidayRepository.listHolidays(params);
  return rows.map(toHolidayDto);
}

export async function createHoliday(values: HolidayWriteInput): Promise<HolidayDto> {
  try {
    const holiday = await holidayRepository.createHoliday(values);
    return toHolidayDto(holiday);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw ApiError.conflict("A holiday is already declared for this city and date");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("Selected city does not exist");
      }
    }
    throw error;
  }
}

export async function deleteHoliday(id: string): Promise<void> {
  try {
    await holidayRepository.deleteHoliday(id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Holiday not found");
    }
    throw error;
  }
}
