import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCityStore } from "@/store/cityStore";
import type { CatalogDetailKind } from "@/utils/routes";

/** When the patient picks a new city (the picker lives in the top nav, not on
 *  this page) while sitting on a city-slugged URL — either a detail page
 *  (`/tests/{citySlug}/{testSlug}` or the packages twin, `itemSlug` given) or
 *  the list page (`/tests/{citySlug}`, `itemSlug` omitted) — swaps that
 *  URL's city segment to match — no manual refresh needed, the page's own
 *  `useQuery` picks up the new `citySlug` param and refetches at the new
 *  city's price automatically, and a URL a patient later shares/bookmarks
 *  always reflects the city they were actually looking at.
 *
 *  A `ref` tracks the previous city slug across renders so a genuine SWITCH
 *  (the picker firing `setCity`) is the only thing that navigates — not the
 *  page simply mounting with whatever city already sat in `useCityStore`
 *  (e.g. a persisted pick from a previous visit). Without that distinction,
 *  opening a shared `/tests/{citySlug}` link would immediately bounce to the
 *  visitor's OLD city instead of showing the one the link was actually
 *  for — same rationale as `useSyncCityPageToRoute`'s own ref.
 *
 *  A no-op everywhere else: pass `undefined` for `currentCitySlug` (the plain
 *  id-based detail route, which carries no city at all) and this never fires
 *  — that route already shows one city-agnostic price regardless of the
 *  picker, so there's nothing here for it to stay in sync with. */
export function useSyncCityToRoute(
  kind: CatalogDetailKind,
  currentCitySlug: string | undefined,
  itemSlug?: string,
) {
  const navigate = useNavigate();
  const city = useCityStore((s) => s.city);
  const previousSlugRef = useRef(city?.slug);

  useEffect(() => {
    const previousSlug = previousSlugRef.current;
    previousSlugRef.current = city?.slug;

    if (!currentCitySlug || !city || !previousSlug || city.slug === previousSlug) return;
    if (city.slug === currentCitySlug) return;
    const path = itemSlug ? `/${kind}/${city.slug}/${itemSlug}` : `/${kind}/${city.slug}`;
    navigate(path, { replace: true });
  }, [city, currentCitySlug, itemSlug, kind, navigate]);
}
