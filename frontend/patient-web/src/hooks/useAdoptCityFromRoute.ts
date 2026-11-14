import { useEffect, useRef } from "react";

import { useCities } from "@/hooks/queries/useCities";
import { useCityStore } from "@/store/cityStore";

/** The URL wins over the picker on arrival at any city-slugged page.
 *
 *  The counterpart to `useSyncCityToRoute`/`useSyncCityPageToRoute`, which
 *  push the picker's city INTO the URL. This pushes the other way: open
 *  `/city/alwar` (a footer city link), `/tests/alwar`, or
 *  `/parameter/alwar/{slug}` and Alwar becomes the selected city — so the
 *  location pill, `GET /user/home`, the catalogue list and every price on the
 *  page follow the link that was actually clicked. Without this the URL said
 *  one city while the page still rendered the previously picked one's
 *  content and prices, which is the entire point of a shared or bookmarked
 *  city link.
 *
 *  Deliberately keyed on the URL slug and the city list ONLY — never on the
 *  selected city. It has to be, to coexist with the store→URL hooks: those
 *  fire on a city change, and if this re-ran on one too, the two would
 *  ping-pong forever (picker sets Jaipur → this re-adopts the URL's Alwar →
 *  the sync hook navigates back → …). Reading the store through `getState()`
 *  inside the effect keeps it out of the dependency list, and a `ref` makes
 *  each distinct slug adopt at most once, so a genuine later switch via the
 *  picker sticks.
 *
 *  Resolved against the same `GET /master/cities` list the picker and footer
 *  already have cached (`useCities`), so this costs no extra request. A slug
 *  matching nothing — mistyped, or a city since deactivated — is left alone
 *  rather than clearing the selection, and stays unmarked so it still adopts
 *  if the list arrives later.
 *
 *  Pass `undefined` on a route with no city segment (the plain `/tests` tab,
 *  the id-based detail fallback) and this never fires. */
export function useAdoptCityFromRoute(citySlug: string | undefined) {
  const { data: cities } = useCities();
  const adoptedSlugRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!citySlug) {
      // Back on a city-less URL — forget what was adopted so returning to
      // the same slug later (with a different city selected by then) adopts
      // it again instead of being mistaken for the current one.
      adoptedSlugRef.current = undefined;
      return;
    }
    if (adoptedSlugRef.current === citySlug) return;

    const match = cities?.find((c) => c.slug === citySlug);
    if (!match) return; // list still loading, or an unknown slug — leave the selection alone

    adoptedSlugRef.current = citySlug;
    const { city, setCity } = useCityStore.getState();
    if (city?.id !== match.id) setCity(match);
  }, [cities, citySlug]);
}
