import { useQuery } from "@tanstack/react-query";

import { fetchRoles } from "@/services/api/role.api";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  });
}
