import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useCityStore } from "@/store/cityStore";
import { buildCityPath } from "@/utils/routes";

/** Sends a visitor who picks a city on Home to that city's own page: choose
 *  Jaipur at `/` and you land on `/jaipur`, which is `CityPage`.
 *
 *  Home itself is city-independent — it names no city and has no `/{slug}`
 *  form — so there is nothing here to keep "in sync"; picking a city is a
 *  request to go somewhere, and this is what takes you.
 *
 *  Fires on `selectionNonce`, not on the city object: picking the city that
 *  was already guessed for you is a real choice even though `city` never
 *  changed, and it still has to navigate. Watching the city instead would
 *  also fire on a cold load, sending every visitor who has ever picked a city
 *  off Home the moment they open it. */
export function useSyncHomeCityToRoute() {
  const navigate = useNavigate();
  const citySlugInStore = useCityStore((s) => s.city?.slug);
  const selectionNonce = useCityStore((s) => s.selectionNonce);
  // Starts at whatever the nonce already is, so mounting is never mistaken
  // for a pick — only a bump that happens while this page is open counts.
  const lastHandledNonceRef = useRef(selectionNonce);

  useEffect(() => {
    if (selectionNonce === lastHandledNonceRef.current) return;
    lastHandledNonceRef.current = selectionNonce;

    if (!citySlugInStore) return;
    // `push`, not `replace`: this is a navigation the visitor asked for, and
    // Back should return them to Home rather than skipping past it.
    navigate(buildCityPath(citySlugInStore));
  }, [selectionNonce, citySlugInStore, navigate]);
}
