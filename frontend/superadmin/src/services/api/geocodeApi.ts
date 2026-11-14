import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

/** OpenStreetMap Nominatim, proxied through our own backend
 *  (`GET /geocode/search`, `/geocode/reverse` — staff-authenticated). Never
 *  called from the browser directly: Nominatim's usage policy needs an
 *  identifying Referer/User-Agent that a browser fetch can't be relied on to
 *  send, and it answers 403 when they're missing. The backend adds both —
 *  see `services/app/geocode.service.ts`. */

/** One forward-search hit. Nominatim's own field names, passed through
 *  untouched by the proxy — hence the snake_case in an otherwise camelCase
 *  codebase. `lat`/`lon` are strings, not numbers, in its JSON. */
export interface GeocodeSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/** Forward search: free text ("andheri west mumbai") → candidate places.
 *  Under 3 characters is answered locally with nothing rather than sent
 *  upstream, matching the backend's own minimum. */
export async function searchPlaces(query: string): Promise<GeocodeSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const response = await httpClient.get<ApiResponseBody<GeocodeSearchResult[]>>("/geocode/search", {
    params: { q: trimmed },
    suppressErrorToast: true,
  });
  return response.data.data ?? [];
}

/** Reverse: coordinates → a human-readable address for the pin, shown under
 *  the map so an admin can confirm they dropped it in the right place (and
 *  optionally reuse it as the center's address). Returns "" when Nominatim
 *  has nothing for that point — open sea, or a gap in OSM coverage — which
 *  is not an error worth blocking the save on. */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const response = await httpClient.get<ApiResponseBody<{ display_name?: string } | null>>(
    "/geocode/reverse",
    { params: { lat, lon }, suppressErrorToast: true },
  );
  return response.data.data?.display_name ?? "";
}
