import { Navigate } from "react-router-dom";

import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/hooks/useAuth";
import { dashboardPathForRole } from "@/utils/roleRoutes";

function RootRedirect() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <FullPageLoader />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}

export { RootRedirect };
