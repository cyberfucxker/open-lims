/**
 * Human-readable franchise codes derived from the franchise name, e.g.
 * "Example Diagnostics Lab Jaipur" -> "RDJ".
 *
 * Deliberately different from `nextOrganizationCode()`'s ORG###### sequence,
 * which stays in place for organizations created outside the Superadmin
 * franchise form and as the collision fallback below. A derived code is worth
 * the extra work here because it is what operators read aloud, write on
 * sample bags, and search by — "RDJ" beats "ORG000018" at all three.
 */

/** Longest derived base before the numeric suffix. Codes live in a
 *  VarChar(20), so this leaves ample room for a suffix. */
const MAX_BASE_LENGTH = 6;

/**
 * Turns a franchise name into its uppercase alphanumeric base code.
 *
 * Multi-word names use the initials of the first `MAX_BASE_LENGTH` words
 * ("Example Diagnostics Lab Jaipur" -> "RDJ"); a single-word name uses its first
 * characters instead ("Medicare" -> "MEDICA"), because a one-letter code is
 * useless. Digits are kept — "24x7 Labs" is a real name — and everything else
 * is dropped.
 *
 * Returns an empty string when the name has no alphanumeric content at all
 * (e.g. only punctuation or a non-Latin script); callers fall back to the
 * ORG###### sequence for those rather than inventing something.
 */
export function deriveFranchiseCodeBase(name: string): string {
  const words = name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase());

  if (words.length === 0) return "";

  if (words.length === 1) {
    return words[0].slice(0, MAX_BASE_LENGTH);
  }

  return words
    .slice(0, MAX_BASE_LENGTH)
    .map((word) => word[0])
    .join("");
}

/**
 * Picks the first free code for `base` given the codes already taken.
 *
 * "RDJ" if free, else "RDJ2", "RDJ3", … The bare base is preferred over
 * "RDJ1" so the common case — one franchise per name — gets the clean code.
 *
 * `takenCodes` is compared case-insensitively even though the column is
 * case-sensitive: two franchises whose codes differ only in case would be
 * indistinguishable to a human reading a form, which defeats the point.
 */
export function pickAvailableCode(base: string, takenCodes: string[]): string | null {
  if (!base) return null;

  const taken = new Set(takenCodes.map((code) => code.toUpperCase()));
  if (!taken.has(base)) return base;

  // Bounded so a pathological data set degrades to the ORG###### fallback
  // instead of looping. 999 same-base franchises is far past the point where a
  // derived code was helping anyone anyway.
  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const candidate = `${base}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }

  return null;
}
