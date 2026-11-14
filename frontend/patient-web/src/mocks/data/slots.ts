import type { SlotItem } from "@/types";

export const SLOT_TEMPLATE: Array<Omit<SlotItem, "isBlocked" | "blockReason">> = [
  { slot_id: "slot_1", title: "06:00 AM - 07:00 AM" },
  { slot_id: "slot_2", title: "07:00 AM - 08:00 AM" },
  { slot_id: "slot_3", title: "08:00 AM - 09:00 AM" },
  { slot_id: "slot_4", title: "09:00 AM - 10:00 AM" },
  { slot_id: "slot_5", title: "10:00 AM - 11:00 AM" },
  { slot_id: "slot_6", title: "11:00 AM - 12:00 PM" },
  { slot_id: "slot_7", title: "04:00 PM - 05:00 PM" },
  { slot_id: "slot_8", title: "05:00 PM - 06:00 PM" },
];

/** Slots deterministically blocked based on the date string so re-renders stay stable
 *  without relying on Math.random() at call time. */
export function buildSlotsForDate(dateStr: string): SlotItem[] {
  const seed = dateStr.split("-").reduce((acc, part) => acc + Number(part), 0);
  return SLOT_TEMPLATE.map((slot, i) => {
    const blocked = (seed + i) % 5 === 0;
    return {
      ...slot,
      isBlocked: blocked,
      blockReason: blocked ? "Fully booked" : null,
    };
  });
}
