import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useAuthDialogStore } from "@/store/authDialogStore";

/**
 * Gate for account routes reached by URL — a bookmark, a shared link, a hard
 * refresh on /orders.
 *
 * It opens the same auth sheet every in-app action uses, over the route the
 * patient actually asked for, and keeps that URL. Signing in therefore drops
 * them exactly where they were headed with no redirect dance and no `from`
 * state to thread through three screens.
 *
 * Dismissing the sheet sends them Home. Leaving them parked on a blank gated
 * route with no way forward would be the one genuinely broken outcome here.
 */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isDialogOpen = useAuthDialogStore((s) => s.isOpen);

  useEffect(() => {
    if (!isAuthenticated) {
      useAuthDialogStore.getState().open({
        reason: "Log in to view your account.",
      });
    }
    // Keyed on the path so navigating between two gated routes while signed
    // out re-opens the sheet rather than silently showing nothing.
  }, [isAuthenticated, location.pathname]);

  // Dismissed without signing in — nothing to show here, so leave.
  if (!isAuthenticated && !isDialogOpen) {
    return <Navigate to="/" replace />;
  }

  // Signed out with the sheet up: render nothing behind it. The page's own
  // queries would 401 anyway, and a flash of empty account UI behind the
  // sheet reads as an error.
  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}

export { ProtectedRoute };
