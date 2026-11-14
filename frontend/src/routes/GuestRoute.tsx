import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/hooks/useAuth";
import { dashboardPathForRole } from "@/utils/roleRoutes";

/** Bounces an already-authenticated user away from guest-only screens (e.g. /login). */
function GuestRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <FullPageLoader />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

export { GuestRoute };
