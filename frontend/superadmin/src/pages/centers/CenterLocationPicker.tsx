import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";
import { Loader2, MapPin, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { reverseGeocode, searchPlaces, type GeocodeSearchResult } from "@/services/api/geocodeApi";

/** Jaipur — the network's home city, so the map opens somewhere useful when
 *  a brand-new center has no coordinates typed yet. */
const DEFAULT_CENTER: [number, number] = [26.9124, 75.7873];
const PIN_ZOOM = 16;
const SEARCH_DEBOUNCE_MS = 400;
/** Reverse-geocoding trails the pin instead of firing on every single
 *  `moveend`: a few seconds of dragging is easily 20+ resting positions, and
 *  the shared Nominatim proxy is rate-limited to 30 requests/minute (see
 *  `rateLimiter.middleware.ts`) — enough for someone placing a pin, not for
 *  one lookup per twitch. The coordinates themselves still update
 *  immediately; only the address label lags. */
const REVERSE_DEBOUNCE_MS = 600;

interface CenterLocationPickerProps {
  /** Current form values, as the raw strings the number inputs hold — "" or
   *  a half-typed "26." both count as "nothing picked yet". */
  latitude: string;
  longitude: string;
  /** Fires on every resting position of the map (drag, zoom, search jump), so
   *  the two coordinate inputs always mirror the pin. Rounded to 7 decimals
   *  to match the column's `Decimal(10,7)` — ~1cm precision, and it keeps a
   *  16-digit float out of the input box. */
  onPick: (latitude: string, longitude: string) => void;
  /** Offered as a quick fill for the Address field — the admin decides,
   *  since Nominatim's line is rarely the shop-number-first address a
   *  patient needs. */
  onUseAddress: (address: string) => void;
}

function parseCoordinate(value: string): number | null {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
}

/** react-leaflet reads `center` only when the map is constructed, so every
 *  later move (a search result pick) has to be imperative. */
function FlyToOnRequest({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, PIN_ZOOM, { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only on a new target
  }, [target?.[0], target?.[1]]);
  return null;
}

/** The map is mounted inside a dialog that zooms in as it opens, so Leaflet's
 *  initial size measurement can land mid-animation and leave the tile grid
 *  half-painted. One `invalidateSize()` on the next frame after mount
 *  re-measures against the settled box. */
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/** Reports where the map came to rest after any pan/zoom — one path for both
 *  a manual drag and a programmatic `flyTo`. */
function MapMoveTracker({ onMoveEnd }: { onMoveEnd: (center: LatLng) => void }) {
  useMapEvents({ moveend: (e) => onMoveEnd(e.target.getCenter()) });
  return null;
}

/** Map + place-search for the Diagnostic Center form's coordinates. Free
 *  OpenStreetMap tiles and keyless Nominatim search (proxied through our own
 *  backend — see `geocodeApi.ts`), so there's no API key to provision.
 *
 *  The pin is fixed at the map's centre and the map pans underneath it,
 *  rather than a draggable marker: no marker-icon assets to bundle (Leaflet's
 *  default icon URLs break under Vite's asset hashing) and the crosshair
 *  reads unambiguously at any zoom.
 *
 *  Mounted only while open — Leaflet cannot measure a `display: none`
 *  container and would paint a grey box. */
function CenterLocationPicker({
  latitude,
  longitude,
  onPick,
  onUseAddress,
}: CenterLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [resolving, setResolving] = useState(false);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  const hasCoords = lat !== null && lng !== null;

  /** Captured once per open so re-renders (which happen on every pan, since
   *  the pin writes back into form state) never re-construct the map at the
   *  new centre and fight the user's drag. */
  const startCenterRef = useRef<[number, number]>(DEFAULT_CENTER);
  if (!open) {
    startCenterRef.current = hasCoords ? [lat, lng] : DEFAULT_CENTER;
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(trimmed)
        .then((r) => {
          if (!cancelled) setResults(r);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  async function resolveAddressAt(atLat: number, atLng: number) {
    setResolving(true);
    try {
      setResolvedAddress(await reverseGeocode(atLat, atLng));
    } catch {
      setResolvedAddress("");
    } finally {
      setResolving(false);
    }
  }

  function scheduleResolve(atLat: number, atLng: number) {
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    setResolving(true);
    reverseTimerRef.current = setTimeout(() => {
      reverseTimerRef.current = null;
      void resolveAddressAt(atLat, atLng);
    }, REVERSE_DEBOUNCE_MS);
  }

  useEffect(
    () => () => {
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    },
    [],
  );

  function handleMoveEnd(center: LatLng) {
    onPick(center.lat.toFixed(7), center.lng.toFixed(7));
    scheduleResolve(center.lat, center.lng);
  }

  function handleOpen() {
    setQuery("");
    setResults([]);
    setResolvedAddress("");
    setOpen(true);
    // The pin has to start somewhere, and the coordinate inputs must say
    // where it is — so a center with nothing typed yet adopts the default
    // centre right away rather than showing a pin over blank inputs. Set
    // explicitly instead of relying on Leaflet to emit a `moveend` for the
    // initial view (it doesn't, reliably).
    const startLat = hasCoords ? lat : DEFAULT_CENTER[0];
    const startLng = hasCoords ? lng : DEFAULT_CENTER[1];
    onPick(startLat.toFixed(7), startLng.toFixed(7));
    void resolveAddressAt(startLat, startLng);
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={handleOpen}>
        <MapPin className="size-4" />
        {hasCoords ? "Adjust location on map" : "Pick location on map"}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Pick location</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          aria-label="Close map"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area, street or landmark…"
            aria-label="Search for a location"
            className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {searching && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>

        {results.length > 0 && (
          // Above Leaflet's own panes (which climb into the 400–700 range)
          // so the dropdown isn't painted behind the tiles.
          <div className="absolute inset-x-0 top-[calc(100%+4px)] z-[1000] max-h-52 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => {
                  setFlyTarget([Number(r.lat), Number(r.lon)]);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full items-start gap-2 border-b border-border/60 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-accent"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative h-60 w-full overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={startCenterRef.current}
          zoom={hasCoords ? PIN_ZOOM : 11}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateSizeOnMount />
          <FlyToOnRequest target={flyTarget} />
          <MapMoveTracker onMoveEnd={handleMoveEnd} />
        </MapContainer>

        {/* Fixed centre crosshair — the map moves under it. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-5">
          <MapPin
            className="size-8 text-primary"
            style={{ filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.35))" }}
            fill="currentColor"
            fillOpacity={0.15}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag the map to place the pin. Coordinates below update as you move.
      </p>

      <div className="rounded-lg border border-dashed border-border bg-background px-3 py-2">
        {resolving ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Resolving address…
          </span>
        ) : resolvedAddress ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span className="line-clamp-2 max-w-full flex-1 text-xs text-foreground">
              {resolvedAddress}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUseAddress(resolvedAddress)}
            >
              Use as address
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            No address found for this point — the coordinates are still saved.
          </span>
        )}
      </div>
    </div>
  );
}

export { CenterLocationPicker };
