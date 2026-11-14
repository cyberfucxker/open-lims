import { useQuery } from "@tanstack/react-query";

import { fetchMyOrganization } from "@/services/api/organization.api";
import { useAuth } from "@/hooks/useAuth";

/** Drives the Collection Center portal shell — which modules to show in the
 *  sidebar and the organization's own branding/name. Only meaningful for a
 *  non-ADMIN (Organization-linked) session. */
export function useMyOrganization() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["organizations", "me"],
    queryFn: fetchMyOrganization,
    enabled: !!user && user.role !== "ADMIN",
    staleTime: 60 * 1000,
  });
}
