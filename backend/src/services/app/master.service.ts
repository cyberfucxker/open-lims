import { prisma } from "../../config/database";

/** Single canonical shape for city master data — see api.md §9 (Get Cities,
 *  Authentication & Session module) for why this exists: Verify OTP and the
 *  Family Members list each embed their own differently-shaped city list
 *  (`{id,name,slug}` vs `{id,city,slug}`). This is the consolidated
 *  replacement new clients (the City picker, address forms, etc.) should
 *  call instead of relying on either of those side-channels. */
export interface CityResult {
  id: string;
  name: string;
  slug: string;
  state_id: string;
  /** So a City dropdown (e.g. the Address form) can show/derive the state
   *  without a second lookup — every city has exactly one state. */
  state_name: string;
  /** City-center point, not any specific lab's address — fallback origin for
   *  "Nearest Lab" distance-sort when device geolocation isn't available.
   *  Null if this city has no fallback point set yet. */
  latitude: number | null;
  longitude: number | null;
}

export interface ListCitiesParams {
  stateId?: string;
  search?: string;
  /** Curated "major city" list for the Home page's "Near You" SEO sections
   *  — see `City.isFeatured`'s doc-comment. Omit for every active city. */
  featured?: boolean;
}

export async function listCities(params: ListCitiesParams = {}): Promise<CityResult[]> {
  const { stateId, search, featured } = params;

  const rows = await prisma.city.findMany({
    where: {
      isActive: true,
      ...(stateId ? { stateId } : {}),
      ...(featured ? { isFeatured: true } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      stateId: true,
      state: { select: { name: true } },
      latitude: true,
      longitude: true,
    },
    orderBy: { name: "asc" },
  });

  // Matched in application code (the city list is tiny — a few dozen rows)
  // rather than a DB `contains`, because the match needs to go both ways:
  // a user typing "jaip" should find "Jaipur" (name contains term), but a
  // reverse-geocoded "Use current location" guess like "Jaipur Municipal
  // Corporation" should *also* find "Jaipur" (term contains name) — that
  // direction is impossible to express as a single-column SQL `contains`
  // since the extra words come from Nominatim's admin-area naming, not
  // from the stored city name.
  const filtered = search
    ? rows.filter((row) => {
        const name = row.name.toLowerCase();
        const term = search.toLowerCase();
        return name.includes(term) || term.includes(name);
      })
    : rows;

  return filtered.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    state_id: row.stateId,
    state_name: row.state.name,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
  }));
}
