import { useCallback } from "react";

import { useAuthStore } from "@/store/authStore";
import { useAuthDialogStore } from "@/store/authDialogStore";

/**
 * Gate an action behind a complete signed-in profile.
 *
 * `requireAuth(fn)` runs `fn` immediately when the patient is already signed
 * in with a finished profile, and otherwise opens the auth sheet and runs it
 * the moment they finish. Callers stop having to think about auth at all:
 *
 *     const { requireAuth } = useAuthGate();
 *     requireAuth(() => addToCart(payload), "Log in to add this to your cart");
 *
 * Profile completeness is part of the gate, not a separate check, because
 * every gated action here — booking, cart, reports — needs a real patient
 * record behind it. A half-finished signup would fail at the API instead.
 */
export function useAuthGate() {
  const requireAuth = useCallback((action: () => void, reason?: string) => {
    const { isAuthenticated, user } = useAuthStore.getState();

    if (isAuthenticated && user?.isProfileComplete) {
      action();
      return;
    }

    useAuthDialogStore.getState().open({ reason, onSuccess: action });
  }, []);

  return { requireAuth };
}
