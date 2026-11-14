import { useQuery } from "@tanstack/react-query";

import { fetchDashboardSummary } from "@/services/api/dashboardSummaryApi";
import type { DashboardPeriod } from "@/lib/types";

export function useDashboardSummary(period: DashboardPeriod) {
  return useQuery({
    queryKey: ["dashboard-summary", period],
    queryFn: () => fetchDashboardSummary(period),
    placeholderData: (prev) => prev,
  });
}
