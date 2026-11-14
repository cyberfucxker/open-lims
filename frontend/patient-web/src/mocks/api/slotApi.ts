import { delay } from "../delay";
import { buildSlotsForDate } from "../data/slots";
import type { SlotAvailabilityResult } from "@/types";

export const slotApi = {
  async getAvailability(date: string): Promise<SlotAvailabilityResult> {
    return delay({
      city: "Jaipur",
      date,
      slots: buildSlotsForDate(date),
    });
  },
};
