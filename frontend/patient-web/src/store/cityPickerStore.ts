import { create } from "zustand";

interface CityPickerState {
  isOpen: boolean;
  /** Pre-set error to show the moment the sheet opens — e.g. first-visit
   *  geolocation landed outside our service area (`useDefaultCityBootstrap`)
   *  and the sheet needs to open already explaining why, not blank. */
  initialError: string | null;
  open: (initialError?: string | null) => void;
  close: () => void;
}

/**
 * Drives the one global "Select City" sheet (see `authDialogStore.ts` for the
 * same reasoning) — a store rather than per-caller `useState` because
 * `useDefaultCityBootstrap` needs to open it from a plain effect, not a
 * component that could render it twice. `LocationPill` and
 * `MobileLocationBar` both call `open()` instead of owning the sheet.
 */
export const useCityPickerStore = create<CityPickerState>()((set) => ({
  isOpen: false,
  initialError: null,
  open: (initialError = null) => set({ isOpen: true, initialError }),
  close: () => set({ isOpen: false, initialError: null }),
}));
