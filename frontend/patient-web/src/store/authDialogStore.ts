import { create } from "zustand";

export type AuthStep = "mobile" | "otp" | "profile";

interface AuthDialogState {
  isOpen: boolean;
  step: AuthStep;
  /** Carried between the mobile and OTP steps, and used by "Resend". */
  mobile: string;
  /** One line explaining WHY the sheet opened — "Log in to add this test to
   *  your cart" reads very differently from a bare "Welcome back" that
   *  appeared for no visible reason. Set by whoever opened it. */
  reason: string | null;
  /** Runs once the patient is fully signed in AND their profile is complete,
   *  which is the only point at which a gated action can actually proceed.
   *  This is what replaces "navigate back to where you were": the action the
   *  patient was trying to take simply happens. */
  onSuccess: (() => void) | null;
  open: (options?: { reason?: string; onSuccess?: () => void }) => void;
  close: () => void;
  setStep: (step: AuthStep) => void;
  setMobile: (mobile: string) => void;
}

/**
 * Drives the one global auth sheet.
 *
 * A store rather than context because the openers are not all components —
 * `useAddToCart` opens it from inside a mutation, and a hook calling a hook
 * from an event handler is the kind of thing that works until someone moves
 * the call. `getState()` works from anywhere.
 */
export const useAuthDialogStore = create<AuthDialogState>((set) => ({
  isOpen: false,
  step: "mobile",
  mobile: "",
  reason: null,
  onSuccess: null,
  open: (options) =>
    set({
      isOpen: true,
      // Always restart at the mobile step. Reopening mid-OTP with a stale
      // number from a previous attempt is a confusing place to land.
      step: "mobile",
      mobile: "",
      reason: options?.reason ?? null,
      onSuccess: options?.onSuccess ?? null,
    }),
  // Deliberately drops `onSuccess` too: a dismissed sheet means the patient
  // changed their mind, and firing the pending action later would be a
  // surprise action they did not ask for.
  close: () => set({ isOpen: false, step: "mobile", mobile: "", reason: null, onSuccess: null }),
  setStep: (step) => set({ step }),
  setMobile: (mobile) => set({ mobile }),
}));
