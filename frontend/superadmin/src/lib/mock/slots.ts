import type { UserAppSlotDay } from "@/lib/types";
import { cities } from "./cities";
import { randInt } from "./generators";

const BUCKET_TEMPLATE = [
  { label: "Early Morning", start: "06:00", end: "08:00" },
  { label: "Morning", start: "08:00", end: "10:00" },
  { label: "Late Morning", start: "10:00", end: "12:00" },
  { label: "Afternoon", start: "14:00", end: "16:00" },
  { label: "Evening", start: "16:00", end: "18:00" },
  { label: "Late Evening", start: "18:00", end: "20:00" },
];

function dateStr(offset: number): string {
  const d = new Date("2026-07-23");
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const slotDays: UserAppSlotDay[] = cities
  .filter((c) => c.active)
  .flatMap((city) =>
    Array.from({ length: 30 }, (_, i) => {
      const buckets = BUCKET_TEMPLATE.map((b, bi) => {
        const capacity = randInt(15, 40);
        const isBlockedDay = i % 17 === 0 && bi === 0;
        const booked = isBlockedDay ? capacity : randInt(0, capacity);
        return {
          id: `${city.id}-${i}-${bi}`,
          label: b.label,
          start: b.start,
          end: b.end,
          capacity,
          booked,
        };
      });
      const totalCapacity = buckets.reduce((s, b) => s + b.capacity, 0);
      const totalBooked = buckets.reduce((s, b) => s + b.booked, 0);
      const ratio = totalBooked / totalCapacity;
      const status: UserAppSlotDay["status"] =
        i % 23 === 0 ? "blocked" : ratio >= 0.95 ? "full" : ratio >= 0.5 ? "partial" : "available";
      return {
        date: dateStr(i - 5),
        cityId: city.id,
        status,
        buckets,
      };
    }),
  );
