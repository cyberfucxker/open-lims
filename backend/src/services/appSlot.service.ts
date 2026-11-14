import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as appSlotRepository from "../repositories/appSlot.repository";
import {
  parseDateOnly,
  toAppSlotDto,
  toDateOnly,
  type AppSlotWriteInput,
} from "../repositories/appSlot.repository";
import type {
  AppSlotDto,
  AppSlotWriteData,
  BulkApplyResult,
  BulkApplySlotsData,
  ListAppSlotsParams,
} from "../types/appSlot.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Slot not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A slot already exists for this center/date/time");
      }
    }
    throw error;
  }
}

function assertTimeOrder(startTime: string, endTime: string): void {
  // Both are validated HH:mm strings, so a plain lexical compare is a
  // correct chronological compare too.
  if (startTime >= endTime) {
    throw ApiError.badRequest("startTime must be before endTime");
  }
}

function toWriteInput(data: AppSlotWriteData): AppSlotWriteInput {
  return {
    centerId: data.centerId ?? null,
    slotDate: data.slotDate,
    startTime: data.startTime,
    endTime: data.endTime,
    capacity: data.capacity,
    surchargeAmount: data.surchargeAmount,
    isBlocked: data.isBlocked,
  };
}

export async function listAppSlots(
  params: ListAppSlotsParams,
): Promise<{ rows: AppSlotDto[]; total: number }> {
  const rows = await appSlotRepository.listAppSlots({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    centerId: params.centerId,
    isBlocked: params.isBlocked,
  });

  const dtos = rows.map(toAppSlotDto);
  return { rows: dtos, total: dtos.length };
}

export async function createAppSlot(data: AppSlotWriteData): Promise<AppSlotDto> {
  assertTimeOrder(data.startTime, data.endTime);

  // The DB unique index on (centerId, slotDate, startTime) doesn't catch
  // duplicates for global (centerId: null) slots — Postgres treats NULLs as
  // distinct, so two null-centerId rows for the same date/time never
  // violate it. Same gap `bulkApplySlots` above works around; check here
  // too so a single manual "Add Slot" can't silently double-book a slot.
  const existingKeys = await appSlotRepository.findExistingSlotKeys(
    data.centerId ?? null,
    data.slotDate,
    data.slotDate,
  );
  if (existingKeys.has(`${data.slotDate}|${data.startTime}`)) {
    throw ApiError.conflict("A slot already exists for this center/date/time");
  }

  const slot = await withTranslatedErrors(() =>
    appSlotRepository.createAppSlot(toWriteInput(data)),
  );
  return toAppSlotDto(slot);
}

export async function updateAppSlot(id: string, data: AppSlotWriteData): Promise<AppSlotDto> {
  assertTimeOrder(data.startTime, data.endTime);

  const slot = await withTranslatedErrors(() =>
    appSlotRepository.updateAppSlot(id, toWriteInput(data)),
  );
  return toAppSlotDto(slot);
}

export async function setAppSlotBlocked(id: string, isBlocked: boolean): Promise<AppSlotDto> {
  const slot = await withTranslatedErrors(() => appSlotRepository.setAppSlotBlocked(id, isBlocked));
  return toAppSlotDto(slot);
}

export async function deleteAppSlot(id: string): Promise<void> {
  const slot = await appSlotRepository.findAppSlotById(id);
  if (!slot) {
    throw ApiError.notFound("Slot not found");
  }
  if (slot.bookedCount > 0) {
    throw ApiError.badRequest("Cannot delete a slot that already has bookings — block it instead.");
  }

  await withTranslatedErrors(() => appSlotRepository.deleteAppSlot(id));
}

/** Every date in `[dateFrom, dateTo]` (inclusive) whose UTC day-of-week is
 *  in `weekdays`. Iterates in UTC to match `parseDateOnly`/`toDateOnly` and
 *  avoid local-timezone/DST drift. */
function enumerateMatchingDates(dateFrom: string, dateTo: string, weekdays: Set<number>): Date[] {
  const start = parseDateOnly(dateFrom);
  const end = parseDateOnly(dateTo);
  const dates: Date[] = [];

  for (let time = start.getTime(); time <= end.getTime(); time += MS_PER_DAY) {
    const date = new Date(time);
    if (weekdays.has(date.getUTCDay())) {
      dates.push(date);
    }
  }

  return dates;
}

export async function bulkApplySlots(data: BulkApplySlotsData): Promise<BulkApplyResult> {
  const start = parseDateOnly(data.dateFrom);
  const end = parseDateOnly(data.dateTo);
  if (start.getTime() > end.getTime()) {
    throw ApiError.badRequest("dateFrom must not be after dateTo");
  }
  for (const bucket of data.buckets) {
    assertTimeOrder(bucket.startTime, bucket.endTime);
  }

  const centerId = data.centerId ?? null;
  const weekdaySet = new Set(data.weekdays);
  const dates = enumerateMatchingDates(data.dateFrom, data.dateTo, weekdaySet);

  // De-dupe against both the DB and anything already queued in this same
  // request — see the note on `findExistingSlotKeys` about why this can't
  // be left to the DB unique constraint alone for global (centerId: null)
  // slots.
  const existingKeys = await appSlotRepository.findExistingSlotKeys(
    centerId,
    data.dateFrom,
    data.dateTo,
  );
  const queuedKeys = new Set<string>();

  const rows: Prisma.SlotUncheckedCreateInput[] = [];
  let skippedCount = 0;

  for (const date of dates) {
    const dateStr = toDateOnly(date);
    for (const bucket of data.buckets) {
      const key = `${dateStr}|${bucket.startTime}`;
      if (existingKeys.has(key) || queuedKeys.has(key)) {
        skippedCount += 1;
        continue;
      }
      queuedKeys.add(key);
      rows.push({
        centerId,
        slotDate: date,
        startTime: bucket.startTime,
        endTime: bucket.endTime,
        capacity: bucket.capacity,
        surchargeAmount: bucket.surchargeAmount ?? 0,
        isBlocked: false,
      });
    }
  }

  if (rows.length === 0) {
    return { createdCount: 0, skippedCount };
  }

  const result = await appSlotRepository.createManyAppSlots(rows);
  // Any rows `skipDuplicates` still caught (e.g. a genuine, non-null
  // centerId race with a concurrent request) count as skipped too.
  skippedCount += rows.length - result.count;

  return { createdCount: result.count, skippedCount };
}
