import { useCallback, useState } from "react";

export type GeolocationStatus = "idle" | "locating" | "granted" | "denied" | "unsupported";

interface GeolocationState {
  status: GeolocationStatus;
  coords: { lat: number; long: number } | null;
}

/** Thin wrapper around the browser Geolocation API for the Nearest Lab flow.
 *  Nothing here persists a location — every call re-asks the browser, which
 *  already caches the permission decision, so a repeat "Use my location" is
 *  instant once granted once. */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle", coords: null });

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported", coords: null });
      return;
    }
    setState((s) => ({ ...s, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "granted",
          coords: { lat: position.coords.latitude, long: position.coords.longitude },
        });
      },
      () => {
        setState({ status: "denied", coords: null });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  return { ...state, request };
}
