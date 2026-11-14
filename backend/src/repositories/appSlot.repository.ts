import type { Prisma, Slot } from "@prisma/client";
import { prisma } from "../config/database";
import type { AppSlotDto } from "../types/appSlot.types";

export interface ListAppSlotsFilter {
  dateFrom: string;
  dateTo: string;
  centerId?: string;
  isBlocked?: string;
}

export interface AppSlotWriteInput {
  centerId?: string | null;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  surchargeAmount?: number;
  isBlocked?: boolean;
}

/** Safety-net cap for the date-range calendar view — not pagination. */
const LIST_LIMIT = 500;

/** `Slot.slotDate` is a Postgres `date` column with no time-of-day/timezone
 *  component; Prisma round-trips it as a UTC-midnight `Date`. Parsing and
 *  formatting through UTC (rather than local time) keeps the calendar date
 *  stable regardless of the server's timezone. */
export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Maps a Prisma row to the exact shape the admin frontend expects. */
export function toAppSlotDto(slot: Slot): AppSlotDto {
  return {
    id: slot.id,
    centerId: slot.centerId,
    slotDate: toDateOnly(slot.slotDate),
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: slot.capacity,
    bookedCount: slot.bookedCount,
    surchargeAmount: Number(slot.surchargeAmount),
    isBlocked: slot.isBlocked,
    computedFull: slot.bookedCount >= slot.capacity,
  };
}

function buildWhere(filter: ListAppSlotsFilter): Prisma.SlotWhereInput {
  const where: Prisma.SlotWhereInput = {
    slotDate: { gte: parseDateOnly(filter.dateFrom), lte: parseDateOnly(filter.dateTo) },
  };

  if (filter.centerId) {
    where.centerId = filter.centerId;
  }
  if (filter.isBlocked === "true") {
    where.isBlocked = true;
  } else if (filter.isBlocked === "false") {
    where.isBlocked = false;
  }

  return where;
}

function toWriteData(data: AppSlotWriteInput): Prisma.SlotUncheckedCreateInput {
  return {
    centerId: data.centerId ?? null,
    slotDate: parseDateOnly(data.slotDate),
    startTime: data.startTime,
    endTime: data.endTime,
    capacity: data.capacity,
    surchargeAmount: data.surchargeAmount ?? 0,
    isBlocked: data.isBlocked ?? false,
  };
}

export function listAppSlots(filter: ListAppSlotsFilter): Promise<Slot[]> {
  return prisma.slot.findMany({
    where: buildWhere(filter),
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    take: LIST_LIMIT,
  });
}

export function findAppSlotById(id: string) {
  return prisma.slot.findUnique({ where: { id } });
}

export function createAppSlot(data: AppSlotWriteInput) {
  return prisma.slot.create({ data: toWriteData(data) });
}

export function updateAppSlot(id: string, data: AppSlotWriteInput) {
  return prisma.slot.update({ where: { id }, data: toWriteData(data) });
}

export function setAppSlotBlocked(id: string, isBlocked: boolean) {
  return prisma.slot.update({ where: { id }, data: { isBlocked } });
}

export function deleteAppSlot(id: string) {
  return prisma.slot.delete({ where: { id } });
}

/** Existing (slotDate, startTime) combinations for a given center within a
 *  date range, as `"YYYY-MM-DD|HH:mm"` keys.
 *
 *  NOTE: the DB-level unique index on `(center_id, slot_date, start_time)`
 *  does NOT reliably dedupe global slots — Postgres treats every NULL
 *  `center_id` as distinct from every other NULL by default, so two rows
 *  with `centerId: null` and the same date/time do not violate the
 *  constraint. Bulk-apply therefore de-dupes at the application level
 *  using this lookup rather than relying on `skipDuplicates` alone. */
export async function findExistingSlotKeys(
  centerId: string | null,
  dateFrom: string,
  dateTo: string,
): Promise<Set<string>> {
  const rows = await prisma.slot.findMany({
    where: {
      centerId,
      slotDate: { gte: parseDateOnly(dateFrom), lte: parseDateOnly(dateTo) },
    },
    select: { slotDate: true, startTime: true },
  });

  return new Set(rows.map((row) => `${toDateOnly(row.slotDate)}|${row.startTime}`));
}

export function createManyAppSlots(rows: Prisma.SlotUncheckedCreateInput[]) {
  return prisma.slot.createMany({ data: rows, skipDuplicates: true });
}
