import { useQuery } from "@tanstack/react-query";

import { slotApi } from "@/services/api/slotApi";

// The booking-lead-time cutoff (and every other availability rule) is now
// computed backend-side — see `slotAvailability.service.ts`'s
// `isWithinBookingLeadTime` — so every client gets pre-filtered slots
// instead of each one reimplementing the cutoff. This hook just passes the
// API response through.
export function useSlotAvailability(dateStr: string | null, addressId: string | null) {
  return useQuery({
    queryKey: ["slots", dateStr, addressId],
    queryFn: () => slotApi.getAvailability(dateStr as string, addressId ?? undefined),
    enabled: !!dateStr,
  });
}
