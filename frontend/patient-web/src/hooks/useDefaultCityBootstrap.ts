import { useEffect } from "react";

import { useGeolocation } from "@/hooks/useGeolocation";
import { masterApi } from "@/services/api/masterApi";
import { useAuthStore } from "@/store/authStore";
import { useCityPickerStore } from "@/store/cityPickerStore";
import { useCityStore } from "@/store/cityStore";
import { buildUnserviceableLocationMessage, reverseGeocodeCity } from "@/utils/reverseGeocode";
import type { City } from "@/types";

const DEFAULT_CITY_NAME = "Jaipur";

async function resolveCityByName(name: string): Promise<City | undefined> {
  const matches = await masterApi.cities({ search: name });
  return matches.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? matches[0];
}

/** First-load fallback so a guest sees a real city instead of "Select
 *  location" — tries the browser's actual location first (the exact same
 *  reverse-geocode-then-match-against-`GET /master/cities` resolution
 *  `SelectCityDialog`'s "Use current location" button uses, just fired the
 *  moment the app opens instead of behind a tap), and only asks for it — no
 *  address is read or saved, this sets nothing but the city dropdown/pill.
 *  Falls back to a hardcoded "Jaipur" if location is denied/unsupported, or
 *  if the coords couldn't be reverse-geocoded at all. If they resolve to a
 *  real place we just don't service, that's not a guess gone wrong the same
 *  way — it opens the city picker with that explained, same as the manual
 *  "Use current location" button would, rather than silently landing the
 *  guest on an unrelated city of ours instead of the one they're actually in.
 *
 *  Never overrides a city the patient already picked (persisted in
 *  `useCityStore`), and deliberately skips this once logged in — a
 *  signed-in patient falls back to their saved address's city instead (see
 *  `useSelectedCityLabel`), which is a better signal than either guess and
 *  shouldn't be clobbered by one.
 *
 *  Goes in through `setDefaultCity`, not `setCity`, so the store remembers
 *  that nobody actually chose this — see `cityStore.ts#isCityExplicit`. A
 *  guessed city prices the page but never gets named in a heading. */
export function useDefaultCityBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const city = useCityStore((s) => s.city);
  const setDefaultCity = useCityStore((s) => s.setDefaultCity);
  const openCityPicker = useCityPickerStore((s) => s.open);
  const geo = useGeolocation();

  useEffect(() => {
    if (city || isAuthenticated) return;
    geo.request();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per guest-with-no-city mount, not on every `geo` identity change
  }, [city, isAuthenticated]);

  useEffect(() => {
    if (city || isAuthenticated) return;
    // Wait for the location request to actually settle one way or another —
    // "idle"/"locating" mean it hasn't yet.
    if (geo.status !== "granted" && geo.status !== "denied" && geo.status !== "unsupported") return;

    let cancelled = false;

    (async () => {
      if (geo.status === "granted" && geo.coords) {
        try {
          const guessedName = await reverseGeocodeCity(geo.coords.lat, geo.coords.long);
          if (cancelled) return;

          if (guessedName) {
            const match = await resolveCityByName(guessedName);
            if (cancelled) return;
            if (match) {
              setDefaultCity(match);
            } else {
              // A real place, just not one we serve — tell the guest why and
              // let them search, rather than quietly defaulting them to
              // Jaipur as if that were their location.
              openCityPicker(buildUnserviceableLocationMessage(guessedName));
            }
            return;
          }
        } catch {
          // Falls through to the hardcoded default below.
        }
      }
      if (cancelled) return;
      try {
        const fallback = await resolveCityByName(DEFAULT_CITY_NAME);
        if (!cancelled && fallback) setDefaultCity(fallback);
      } catch {
        // Silent — worst case a guest sees "Select location" until they pick one themselves.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    city,
    isAuthenticated,
    geo.status,
    geo.coords?.lat,
    geo.coords?.long,
    setDefaultCity,
    openCityPicker,
  ]);
}
