import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useCityStore } from "@/store/cityStore";
import { buildCityPath } from "@/utils/routes";

/** Keeps a city landing page's URL pointing at the city it is actually
 *  showing: pick Jaipur from the picker while on `/city/ajmer` and the URL
 *  becomes `/city/jaipur`, so the page someone then bookmarks or shares is
 *  the one they were looking at.
 *
 *  A `ref` tracks the previous slug across renders so only a genuine SWITCH
 *  navigates — not the page simply mounting with whatever city already sat in
 *  `useCityStore` from a previous visit. Without that, opening a shared
 *  `/city/ajmer` link would immediately bounce the visitor to their own old
 *  city, which defeats the entire point of the link. Same reasoning, and the
 *  same shape, as `useSyncCityToRoute` for the catalogue routes.
 *
 *  The counterpart pushing the other way is `useAdoptCityFromRoute`. The two
 *  coexist because each no-ops once the URL and the store agree. */
export function useSyncCityPageToRoute(currentCitySlug: string | undefined) {
  const navigate = useNavigate();
  const city = useCityStore((s) => s.city);
  const previousSlugRef = useRef(city?.slug);

  useEffect(() => {
    const previousSlug = previousSlugRef.current;
    previousSlugRef.current = city?.slug;

    if (!currentCitySlug || !city || !previousSlug || city.slug === previousSlug) return;
    if (city.slug === currentCitySlug) return;
    navigate(buildCityPath(city.slug), { replace: true });
  }, [city, currentCitySlug, navigate]);
}
