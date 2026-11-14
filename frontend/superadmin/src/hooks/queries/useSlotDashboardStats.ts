import { useQuery } from "@tanstack/react-query";

import { fetchSlotDashboardStats } from "@/services/api/slotDashboardStatsApi";

export function useSlotDashboardStats() {
  return useQuery({
    queryKey: ["slot-dashboard-stats"],
    queryFn: fetchSlotDashboardStats,
  });
}
