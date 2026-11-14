import { useEffect, useMemo, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  useApiIsLoaded,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGeolocation } from "@/hooks/useGeolocation";

/** Empty in a checkout that hasn't set `VITE_GOOGLE_MAPS_API_KEY` in its own
 *  `.env` — see `.env.example`. Guarded in the exported component below
 *  rather than left to fail inside `APIProvider`, so a teammate without the
 *  key yet gets a clear inline message instead of a blank map and a console
 *  error. */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/** Falls back to New Delhi when no address/GPS coords are available yet —
 *  only ever seen for a moment before the user searches or grants location. */
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const PIN_ZOOM = 17;

export interface ResolvedAddress {
  displayName: string;
  /** Best-effort "house-number + road" line — a hint, not authoritative.
   *  House/flat number is still left for the user to confirm/type, since a
   *  geocoder's street number is imprecise for Indian addresses. */
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PickedLocation extends ResolvedAddress {
  lat: number;
  lng: number;
}

interface AddressMapPickerProps {
  initialCenter?: { lat: number; lng: number } | null;
  /** Shown in the readout until the patient actually moves the pin — the
   *  address already saved, when editing one. Without it an edit would open
   *  reading "move the map to place the pin", as if nothing were set. */
  initialSummary?: string | null;
  /** Fires on every settled pin, not on a "confirm" tap — the map is part of
   *  the form now rather than a separate step with its own CTA, so the
   *  form's own Save button is the only confirmation there is.
   *
   *  Deliberately silent until the patient moves the map, picks a search
   *  result or grants GPS: firing on mount would let an edit that never
   *  touched the map overwrite a saved address with a reverse-geocode of
   *  its own pin — or, for a legacy address with no coordinates at all,
   *  with the fallback city. No interaction, no location change. */
  onChange: (location: PickedLocation | null) => void;
}

/** A typed-and-narrowed-down suggestion the patient can tap — keeps the raw
 *  `PlacePrediction` around (not just its text) so picking one can call
 *  `.toPlace()` on the exact object the dropdown showed. */
interface SearchSuggestion {
  placeId: string;
  text: string;
  prediction: google.maps.places.PlacePrediction;
}

/** Extracts the fields `ResolvedAddress` needs from a Geocoder result's
 *  `address_components` — looked up by type rather than by array position,
 *  since Google doesn't guarantee an order. The one thing every pin on this
 *  map is reverse-geocoded through, whether it got there by drag, GPS, or a
 *  search pick (see `pickSuggestion` below) — one parser, one shape, however
 *  the pin arrived. */
function parseGeocoderResult(result: google.maps.GeocoderResult): ResolvedAddress {
  const component = (type: string) =>
    result.address_components.find((c) => c.types.includes(type))?.long_name ?? "";

  const addressLine = [component("street_number"), component("route")].filter(Boolean).join(" ");

  return {
    displayName: result.formatted_address,
    addressLine: addressLine || result.formatted_address,
    locality:
      component("sublocality_level_1") || component("sublocality") || component("neighborhood"),
    city: component("locality") || component("administrative_area_level_2"),
    state: component("administrative_area_level_1"),
    pincode: component("postal_code"),
  };
}

/** Imperatively pans the already-mounted map whenever `target` changes — the
 *  `Map` component's own `defaultCenter`/`defaultZoom` are read only once, at
 *  construction, so a search pick or "use current location" has to move the
 *  map this way instead of through props. */
function FlyToOnRequest({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    map.setZoom(PIN_ZOOM);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when a new target is requested
  }, [map, target?.lat, target?.lng]);
  return null;
}

/** Search box + map, inline at the top of the Add/Edit Address form. This
 *  used to be `LocationPickerSheet` — a second bottom sheet stacked over the
 *  form, behind a "Set location on map" button. It is the form's first field
 *  now, because it is the only thing that produces the address, pincode and
 *  coordinates at all: the form below it collects a flat number and a
 *  landmark, nothing more.
 *
 *  Google Maps JavaScript API — search via the current Places Autocomplete
 *  (`AutocompleteSuggestion`, not the deprecated `AutocompleteService`) and
 *  reverse geocoding via the plain Geocoding API, which isn't deprecated and
 *  is the one thing every pin resolves through however it got there. The pin
 *  stays fixed at the map's centre and the map pans underneath it, same as
 *  before, which reads better on touch than a draggable marker. */
function AddressMapPickerInner({ initialCenter, initialSummary, onChange }: AddressMapPickerProps) {
  const startPosition = initialCenter ?? DEFAULT_CENTER;

  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [resolved, setResolved] = useState<ResolvedAddress | null>(null);
  const [resolving, setResolving] = useState(false);
  // Google fires an `idle` event for the map's very first, declarative view —
  // Leaflet's equivalent `moveend` never did. Skipping exactly the first one
  // is what keeps this component silent on an untouched edit instead of
  // immediately overwriting the saved address — see `onChange`'s doc-comment.
  const hasSettledOnceRef = useRef(false);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 400);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  // Spans one search "session" per Google's own billing guidance — spent on
  // the fetchFields call in `pickSuggestion`, then nulled so the next search
  // starts a fresh one instead of reusing a concluded token.
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const geo = useGeolocation();
  const locating = geo.status === "locating";

  const placesLib = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");
  const geocoder = useMemo(
    () => (geocodingLib ? new geocodingLib.Geocoder() : null),
    [geocodingLib],
  );

  // `onChange` is re-created on every render of the parent form; keeping it
  // in a ref means the resolve effects below don't have to list it as a
  // dependency and re-fire the geocode on every keystroke in the form.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  async function resolveCenter(lat: number, lng: number) {
    if (!geocoder) return;
    setResolving(true);
    onChangeRef.current(null);
    try {
      const { results } = await geocoder.geocode({ location: { lat, lng } });
      const parsed = results[0] ? parseGeocoderResult(results[0]) : null;
      setResolved(parsed);
      onChangeRef.current(parsed ? { ...parsed, lat, lng } : null);
    } catch {
      setResolved(null);
      onChangeRef.current(null);
    } finally {
      setResolving(false);
    }
  }

  function handleIdle(map: google.maps.Map) {
    if (!hasSettledOnceRef.current) {
      hasSettledOnceRef.current = true;
      return;
    }
    const center = map.getCenter();
    if (center) void resolveCenter(center.lat(), center.lng());
  }

  // A brand-new address has no saved location to start from, so ask for the
  // patient's current location straight away: the map then opens centred on
  // them rather than on the fallback city they'd have to navigate away from.
  // The resulting fly-in settles into `handleIdle` like any other move,
  // which is what actually resolves and emits the address. Editing keeps its
  // own saved pin untouched unless GPS is asked for again.
  useEffect(() => {
    if (!initialCenter) geo.request();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  useEffect(() => {
    if (geo.status === "granted" && geo.coords) {
      setFlyTarget({ lat: geo.coords.lat, lng: geo.coords.long });
    }
  }, [geo.status, geo.coords?.lat, geo.coords?.long]);

  useEffect(() => {
    let cancelled = false;
    if (!placesLib || debouncedQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    sessionTokenRef.current ??= new placesLib.AutocompleteSessionToken();

    setSearching(true);
    placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: debouncedQuery,
      includedRegionCodes: ["in"],
      sessionToken: sessionTokenRef.current,
    })
      .then(({ suggestions: results }) => {
        if (cancelled) return;
        setSuggestions(
          results.flatMap((s) =>
            s.placePrediction
              ? [
                  {
                    placeId: s.placePrediction.placeId,
                    text: s.placePrediction.text.text,
                    prediction: s.placePrediction,
                  },
                ]
              : [],
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placesLib, debouncedQuery]);

  async function pickSuggestion(suggestion: SearchSuggestion) {
    setQuery("");
    setSuggestions([]);
    sessionTokenRef.current = null; // spent — the next search starts a fresh one

    try {
      const { place } = await suggestion.prediction.toPlace().fetchFields({ fields: ["location"] });
      // Fly there and let the settle-triggered reverse-geocode (the same
      // path a drag or GPS fix goes through) resolve the final address —
      // rather than trusting the prediction's own text, which can describe
      // an area broader than the exact point the pin lands on.
      if (place.location) setFlyTarget({ lat: place.location.lat(), lng: place.location.lng() });
    } catch {
      // A failed detail fetch just leaves the pin where it was.
    }
  }

  const apiIsLoaded = useApiIsLoaded();

  return (
    <div className="space-y-2">
      {/* Search sits above the map, and its results overlay it — `z-20`
          clears the map's own controls (zoom buttons, attribution). */}
      <div className="relative z-20">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 focus-within:border-primary/60">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, area or landmark"
            aria-label="Search address"
            className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {searching ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-border bg-card shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onClick={() => void pickSuggestion(s)}
                className="flex w-full items-start gap-2 border-b border-border/60 px-3.5 py-2.5 text-left text-sm last:border-b-0 hover:bg-accent"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{s.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative h-52 w-full overflow-hidden rounded-xl border border-border sm:h-60">
        <Map
          defaultCenter={startPosition}
          defaultZoom={PIN_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          scrollwheel={false}
          className="size-full"
          onIdle={(e) => handleIdle(e.map)}
        />
        <FlyToOnRequest target={flyTarget} />

        {!apiIsLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Fixed centre pin — the map pans underneath it instead of using a
            draggable marker. */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pb-5">
          <MapPin
            className="size-8 text-primary"
            style={{ filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.35))" }}
            fill="currentColor"
            fillOpacity={0.15}
          />
        </div>

        <button
          type="button"
          onClick={geo.request}
          disabled={locating}
          className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-md transition-colors hover:bg-accent disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LocateFixed className="size-3.5" />
          )}
          {locating ? "Locating…" : "Use current location"}
        </button>
      </div>

      {/* The pinned address, read back to the patient. There is no editable
          full-address field any more, so this readout is the only place they
          can see what is actually about to be saved — which makes "drag the
          pin until this line is right" the whole interaction. */}
      <div className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-xs">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
        {resolving ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Getting address…
          </span>
        ) : (resolved?.displayName ?? initialSummary) ? (
          <span className="line-clamp-2 leading-relaxed text-foreground">
            {resolved?.displayName ?? initialSummary}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Move the map to place the pin on your exact location.
          </span>
        )}
      </div>
    </div>
  );
}

/** Local-only for now — see the doc-comment on `GOOGLE_MAPS_API_KEY` and
 *  `.env.example`. Not wired into the production deploy yet: a real key
 *  needs its HTTP referrer restrictions set to the live domain first. */
function MissingApiKeyNotice() {
  return (
    <div className="flex h-52 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center sm:h-60">
      <MapPin className="size-5 text-muted-foreground" />
      <p className="text-xs font-medium text-foreground">Map needs a Google Maps API key</p>
      <p className="text-xs text-muted-foreground">
        Set <code className="rounded bg-muted px-1 py-0.5">VITE_GOOGLE_MAPS_API_KEY</code> in your
        own <code className="rounded bg-muted px-1 py-0.5">.env</code>.
      </p>
    </div>
  );
}

function AddressMapPicker(props: AddressMapPickerProps) {
  if (!GOOGLE_MAPS_API_KEY) return <MissingApiKeyNotice />;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <AddressMapPickerInner {...props} />
    </APIProvider>
  );
}

export { AddressMapPicker };
