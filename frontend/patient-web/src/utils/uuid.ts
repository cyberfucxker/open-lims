const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a DB-generated `gen_random_uuid()` id — every Test/Package `id`
 *  is shaped like this, and no city `slug` ever is. Used to tell the two
 *  apart when they share one single-dynamic-segment route (see
 *  `routes/index.tsx`'s `/tests/:id` and `/packages/:id`, which now also
 *  double as the city-scoped list page's landing URL). */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
