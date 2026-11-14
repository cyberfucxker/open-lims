/** Free, keyless reverse geocoding via OpenStreetMap Nominatim — enough to
 *  guess a city name from GPS coords for the "Use current location"
 *  shortcut in the city picker. Not meant for production-scale volume:
 *  Nominatim's usage policy caps this around 1 request/second per client:
 *  swap for a paid provider (Google Maps Geocoding, etc.) if this needs to
 *  scale beyond occasional, user-triggered lookups. */
export async function reverseGeocodeCity(lat: number, long: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}&zoom=10&addressdetails=1`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;

  const body = (await response.json()) as { address?: Record<string, string> };
  const address = body.address ?? {};
  return address.city || address.town || address.village || address.county || null;
}

/** Shared wording for "detected/guessed location isn't one we service" —
 *  used both by the manual "Use current location" button and by
 *  `useDefaultCityBootstrap`'s automatic first-visit detection, so the two
 *  paths never drift into saying this two different ways. */
export function buildUnserviceableLocationMessage(cityName: string): string {
  return `Apologies, but our services haven't launched in ${cityName} yet. Please search for your city to explore active zones.`;
}
