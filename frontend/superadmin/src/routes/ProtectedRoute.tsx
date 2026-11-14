import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { FullPageLoader } from "@/components/common/FullPageLoader";
import { useAuth } from "@/hooks/useAuth";
import { homeForUser } from "@/routes/roleHome";
import type { Role } from "@/types/auth";

interface ProtectedRouteProps extends PropsWithChildren {
  /** Roles allowed through. Omitted means "any authenticated user", which is
   *  only appropriate for routes that are genuinely role-neutral. */
  allowedRoles?: Role[];
}

/**
 * Authentication AND role gate.
 *
 * The role check is not cosmetic: before it existed, any authenticated
 * non-admin — a franchise portal login, say — rendered the full Superadmin
 * shell. The APIs behind it returned 403, so no data leaked, but the navigation
 * exposed the entire admin surface and every page showed an error instead of a
 * redirect.
 *
 * A user with the wrong role is redirected to their own home rather than shown
 * a "forbidden" page: for them the route does not exist, and a dead end with no
 * way back is worse than landing somewhere useful.
 */
function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeForUser(user)} replace />;
  }

  return <>{children}</>;
}

export { ProtectedRoute };
