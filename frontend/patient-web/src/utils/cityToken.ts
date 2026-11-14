const CITY_TOKEN = /\{city\}/g;

/** Substitutes the literal `{city}` token used by `HomeFaq`/`HomeSeoContent`
 *  copy (authored in Superadmin CMS) with the patient's selected city name,
 *  or a generic fallback when no city is picked yet (guest, first load). */
export function withCityToken(text: string, cityName: string | undefined): string {
  return text.replace(CITY_TOKEN, cityName || "your city");
}
