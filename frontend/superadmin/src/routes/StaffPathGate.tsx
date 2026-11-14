import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { canAccessPath, managerHome } from "@/config/staffModules";
import { useAuth } from "@/hooks/useAuth";

/** Keeps a MANAGER inside the modules they were granted: any other admin URL
 *  (typed, bookmarked, or linked) sends them to their own first module. The
 *  backend refuses those APIs anyway — this just avoids rendering a page full
 *  of 403s. A no-op for ADMIN. */
function StaffPathGate({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (user && !canAccessPath(user, pathname)) {
    return <Navigate to={managerHome(user)} replace />;
  }
  return <>{children}</>;
}

export { StaffPathGate };
