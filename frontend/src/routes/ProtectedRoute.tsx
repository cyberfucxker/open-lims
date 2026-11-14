import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/auth";
import { dashboardPathForRole } from "@/utils/roleRoutes";

interface ProtectedRouteProps extends PropsWithChildren {
  /** Omit to allow any authenticated role. */
  allowedRoles?: Role[];
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

export { ProtectedRoute };
