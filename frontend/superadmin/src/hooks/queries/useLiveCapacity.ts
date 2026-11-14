import { useQuery } from "@tanstack/react-query";

import { fetchLiveCapacity } from "@/services/api/liveCapacityApi";

export function useLiveCapacity(params: { cityId?: string; date?: string }) {
  return useQuery({
    queryKey: ["live-capacity", params],
    queryFn: () =>
      fetchLiveCapacity({ cityId: params.cityId as string, date: params.date as string }),
    enabled: Boolean(params.cityId && params.date),
  });
}
