import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, LocateFixed, Search } from "lucide-react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useCities } from "@/hooks/queries/useCities";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGeolocation } from "@/hooks/useGeolocation";
import { masterApi } from "@/services/api/masterApi";
import { useCityPickerStore } from "@/store/cityPickerStore";
import { useCityStore } from "@/store/cityStore";
import { buildUnserviceableLocationMessage, reverseGeocodeCity } from "@/utils/reverseGeocode";
import { cn } from "@/utils/cn";
import type { City } from "@/types";

/** "Select City" picker — desktop centred dialog / mobile full-sheet, for free,
 *  via `BottomSheet`. Mounted once in `AppShell`, opened from anywhere
 *  through `cityPickerStore` (`LocationPill`, `MobileLocationBar`, and
 *  `useDefaultCityBootstrap` for the automatic first-visit case) — the same
 *  reasoning as `AuthDialog`/`authDialogStore`: a plain effect needs to be
 *  able to open this, not just a component with local state.
 *
 *  Search hits `GET /master/cities` (debounced); "Use current location"
 *  reverse-geocodes the browser's GPS coords to a city name, then looks that
 *  name up against the same endpoint. */
function SelectCityDialog() {
  const { isOpen, initialError, close } = useCityPickerStore();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const { city: selectedCity, setCity } = useCityStore();
  const { data: cities, isLoading, isError } = useCities({ search: debouncedQuery || undefined });
  // Only fetched/shown above the full list while the search box is empty —
  // once the patient starts typing, the filtered `cities` list above is the
  // whole point, and showing both would just be noise.
  const { data: popularCities } = useCities({ featured: true });
  const showPopular = !debouncedQuery && !!popularCities?.length;

  const geo = useGeolocation();
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset per-open transient state so a re-open never shows a stale
  // search/error — except the error, which starts from whatever the opener
  // (e.g. a failed auto-detect) asked to show.
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setLocateError(initialError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/close, not every initialError change
  }, [isOpen]);

  // Whenever an error tells the patient to search instead, put the cursor
  // straight into the search box rather than leaving them to find it —
  // covers both this initial error and every error set below.
  useEffect(() => {
    if (locateError) searchInputRef.current?.focus();
  }, [locateError]);

  useEffect(() => {
    if (geo.status === "denied") {
      setLocateError(
        "Location access was denied — enable it in your browser, or search for your city.",
      );
    } else if (geo.status === "unsupported") {
      setLocateError("Location isn't supported on this browser — please search for your city.");
    }
  }, [geo.status]);

  useEffect(() => {
    if (geo.status !== "granted" || !geo.coords) return;
    const { lat, long } = geo.coords;
    let cancelled = false;

    (async () => {
      setResolvingLocation(true);
      setLocateError(null);
      try {
        const guessedName = await reverseGeocodeCity(lat, long);
        if (cancelled) return;
        if (!guessedName) {
          setLocateError("Couldn't detect your city automatically — please search for it.");
          return;
        }

        const matches = await masterApi.cities({ search: guessedName });
        if (cancelled) return;
        const match =
          matches.find((c) => c.name.toLowerCase() === guessedName.toLowerCase()) ?? matches[0];

        if (match) {
          choose(match);
        } else {
          setLocateError(buildUnserviceableLocationMessage(guessedName));
        }
      } catch {
        if (!cancelled)
          setLocateError("Couldn't detect your city automatically — please search for it.");
      } finally {
        if (!cancelled) setResolvingLocation(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when a fresh coords pair lands
  }, [geo.status, geo.coords?.lat, geo.coords?.long]);

  function choose(city: City) {
    setCity(city);
    close();
  }

  const locating = geo.status === "locating" || resolvingLocation;

  return (
    <BottomSheet open={isOpen} onOpenChange={(next) => !next && close()} className="md:!max-w-md">
      <div className="flex items-center justify-between pr-9">
        <button
          type="button"
          onClick={close}
          className="flex items-center gap-1 text-base font-bold text-foreground"
        >
          <ChevronLeft className="size-5" />
          Select City
        </button>
        {selectedCity && (
          <span className="text-base font-bold text-primary">{selectedCity.name}</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full bg-muted px-4 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Your City"
          aria-label="Search your city"
          className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <button
        type="button"
        onClick={geo.request}
        disabled={locating}
        className="mt-3 flex w-full items-center gap-2.5 rounded-xl bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LocateFixed className="size-4" />
        )}
        {locating ? "Detecting your location…" : "Use current location"}
      </button>
      {locateError && <p className="mt-1.5 px-1 text-xs text-destructive">{locateError}</p>}

      {showPopular && (
        <div className="mt-4">
          <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Popular Cities
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {popularCities.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => choose(c)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  selectedCity?.id === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary/40 hover:bg-accent",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 max-h-[50vh] overflow-y-auto">
        {showPopular && (
          <p className="px-1 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            All Cities
          </p>
        )}
        {isLoading ? (
          <div className="space-y-4 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-destructive">
            Couldn't load cities. Please try again.
          </p>
        ) : cities && cities.length > 0 ? (
          cities.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c)}
              className={cn(
                "flex w-full items-center border-b border-border/60 py-3.5 text-left text-[15px] transition-colors last:border-b-0",
                selectedCity?.id === c.id
                  ? "font-bold text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.name}
            </button>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No cities found for "{query}".
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

export { SelectCityDialog };
