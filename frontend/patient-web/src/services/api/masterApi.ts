import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { City } from "@/types";

export interface ListCitiesParams {
  state_id?: string;
  search?: string;
  /** Curated "major city" flag, used for the Home page's "Near You" link
   *  sections — showing all 60+ active cities there would be unreadable. */
  featured?: boolean;
}

/** Matches `GET /master/cities` — the single canonical city list (see
 *  api.md's Auth & Session module, API 9). Public, no auth required. */
export const masterApi = {
  async cities(params?: ListCitiesParams): Promise<City[]> {
    const response = await httpClient.get<AppApiResponseBody<City[]>>("/master/cities", {
      params,
    });
    return response.data.data ?? [];
  },
};
