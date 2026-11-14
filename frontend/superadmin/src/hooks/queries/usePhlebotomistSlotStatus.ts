import { useQuery } from "@tanstack/react-query";

import { fetchPhlebotomistSlotStatus } from "@/services/api/phlebotomistSlotStatusApi";

export function usePhlebotomistSlotStatus(params: { cityId?: string; date?: string }) {
  return useQuery({
    queryKey: ["phlebotomist-slot-status", params],
    queryFn: () =>
      fetchPhlebotomistSlotStatus({
        cityId: params.cityId as string,
        date: params.date as string,
      }),
    enabled: Boolean(params.cityId && params.date),
  });
}
