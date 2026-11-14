import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { SlotAvailabilityResult } from "@/types";

/** Real replacement for `mocks/api/slotApi.ts` — matches
 *  `GET /user/slot-availability`. The Patient App is home-collection only
 *  (the backend only ever returns non-center slots), so there's no
 *  center/visit-type param here. */
export const slotApi = {
  async getAvailability(date: string, addressId?: string): Promise<SlotAvailabilityResult> {
    const response = await httpClient.get<AppApiResponseBody<SlotAvailabilityResult>>(
      "/user/slot-availability",
      { params: { date, address_id: addressId } },
    );
    return response.data.data as SlotAvailabilityResult;
  },
};
