import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { City } from "@/types";

interface CityState {
  city: City | null;
  /** Bumped on every pick from the picker — including re-picking the city
   *  that was already selected.
   *
   *  `useSyncHomeCityToRoute` watches this rather than `city` itself, because
   *  "did the patient just choose a city" and "is the selected city different
   *  from last render" are not the same question. A visitor whose city was
   *  guessed for them (`setDefaultCity`) and who then picks that very city
   *  from the list has changed nothing about `city` — but they HAVE made a
   *  choice, and the URL has to reflect it, or the picker looks broken.
   *
   *  Not persisted: it only means something within one page session, and a
   *  stale count restored from storage would look like a fresh pick on load. */
  selectionNonce: number;
  /** A city the patient asked for — the picker, or a URL naming one. */
  setCity: (city: City) => void;
  /** The first-load fallback (`useDefaultCityBootstrap`). Never overrides a
   *  city that is already set, and never counts as a choice. */
  setDefaultCity: (city: City) => void;
}

/** Persists the patient's chosen service city across sessions — read by the
 *  `LocationPill` (TopNav) and the Select City picker. Independent of any
 *  saved address's free-text `city` field; this is just "what am I browsing
 *  as," not tied to where an order ships.
 *
 *  Note this is not what decides whether a city gets NAMED on the page —
 *  that is the URL's job (see `HomePage`/`CityPage`). This only decides what
 *  gets priced. */
export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      city: null,
      selectionNonce: 0,
      setCity: (city) => set((s) => ({ city, selectionNonce: s.selectionNonce + 1 })),
      setDefaultCity: (city) => set((s) => (s.city ? s : { city })),
    }),
    {
      name: "patient-web-city",
      version: 2,
      // Only the city itself survives a reload; see `selectionNonce` above.
      partialize: (s) => ({ city: s.city }),
      migrate: (persisted) => ({ city: (persisted as Partial<CityState>)?.city ?? null }),
    },
  ),
);
