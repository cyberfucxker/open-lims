import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThirdPartyLabState {
  userFID: string | null;
  mobile: string | null;
  setLinked: (userFID: string, mobile: string) => void;
  clear: () => void;
}

/** Persists the third-party partner UserFID once the OTP link flow
 *  succeeds, so returning to the Reports page doesn't require re-verifying
 *  every visit — mirrors authStore's localStorage-backed persist pattern. */
export const useThirdPartyLabStore = create<ThirdPartyLabState>()(
  persist(
    (set) => ({
      userFID: null,
      mobile: null,
      setLinked: (userFID, mobile) => set({ userFID, mobile }),
      clear: () => set({ userFID: null, mobile: null }),
    }),
    { name: "patient-web-third-party-lab" },
  ),
);
