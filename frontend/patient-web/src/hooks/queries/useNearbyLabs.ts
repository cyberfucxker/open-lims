import { useQuery } from "@tanstack/react-query";

import { centerApi } from "@/services/api/centerApi";

export function useNearbyLabs(coords?: { lat: number; long: number }) {
  return useQuery({
    // Distinct keys per coordinate pair so panning to a new location — or the
    // very first successful geolocation fix — refetches distance-sorted.
    queryKey: ["nearby-labs", coords ?? null],
    queryFn: () => centerApi.list(coords),
    placeholderData: (prev) => prev,
  });
}

export function useLabDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["nearby-labs", "detail", id],
    queryFn: () => centerApi.getById(id!),
    enabled: Boolean(id),
  });
}
