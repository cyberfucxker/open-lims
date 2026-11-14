import { useQuery } from "@tanstack/react-query";

import { fetchServiceCenters } from "@/services/api/serviceCenterApi";

export function useServiceCenters() {
  return useQuery({
    queryKey: ["service-centers"],
    queryFn: fetchServiceCenters,
    staleTime: 5 * 60 * 1000,
  });
}
