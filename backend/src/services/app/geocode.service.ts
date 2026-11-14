import { ApiError } from "../../utils/ApiError";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

/** OpenStreetMap Nominatim's usage policy requires a valid `Referer` or
 *  identifying `User-Agent` on every request — a browser calling it directly
 *  sends whatever `Referrer-Policy` happens to leave intact (which, in
 *  practice, some in-app WebViews and privacy-hardened browsers strip
 *  entirely), and gets a flat 403 the instant it doesn't. Proxying through
 *  this backend means the app always sends the same two headers itself,
 *  server-to-server, regardless of what the patient's browser/WebView does —
 *  see `LocationPickerSheet.tsx`/`utils/nominatim.ts`, which call this
 *  backend's `/app/geocode/*` routes instead of Nominatim directly. */
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "OpenLimsApp/1.0 (+https://example.com; contact: info@example.com)",
  Referer: "https://example.com/",
};

async function nominatimGet(path: string): Promise<unknown> {
  const response = await fetch(`${NOMINATIM_BASE}${path}`, { headers: NOMINATIM_HEADERS });
  if (!response.ok) {
    throw ApiError.internal("Could not reach the location search service");
  }
  return response.json();
}

export async function searchAddress(query: string): Promise<unknown> {
  const path = `/search?format=jsonv2&addressdetails=0&countrycodes=in&limit=6&q=${encodeURIComponent(query)}`;
  return nominatimGet(path);
}

export async function reverseGeocode(lat: number, lon: number): Promise<unknown> {
  const path = `/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  return nominatimGet(path);
}
