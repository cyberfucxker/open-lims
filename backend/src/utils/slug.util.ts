/** Lowercases, strips anything that isn't a letter/digit into single hyphens,
 *  and trims leading/trailing hyphens — the same rule the
 *  `add_slug_to_tests_and_packages` migration's SQL backfill used, so a slug
 *  generated here for a brand-new row reads identically to one derived from
 *  existing data. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Appends `-2`, `-3`, … until `isTaken` reports a free slug — the same
 *  disambiguation the migration's backfill used for name collisions. Callers
 *  pass a lookup scoped to the exact table/uniqueness they care about (and,
 *  for an update, one that excludes the row being renamed). */
export async function generateUniqueSlug(
  name: string,
  isTaken: (candidate: string) => Promise<boolean>,
  fallback = "item",
): Promise<string> {
  const base = slugify(name) || fallback;
  let candidate = base;
  let suffix = 2;
  while (await isTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
