import { useQuery } from "@tanstack/react-query";

import { callWithFallback } from "@/services/api/callWithFallback";
import { fetchDashboardSummary } from "@/services/api/dashboardApi";
import { getDashboardSummary } from "@/services/mock/dashboardService";
import type { DashboardPeriod, DashboardQueryParams } from "@/types/dashboard";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Resolves a period toggle into explicit dateFrom/dateTo — "today" is left
 *  as `undefined` so the backend applies its own default (today, server
 *  local time) rather than us duplicating that timezone-sensitive logic. */
export function periodToRange(period: DashboardPeriod): DashboardQueryParams {
  const now = new Date();

  if (period === "today") return {};

  if (period === "week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { dateFrom: toIsoDate(from), dateTo: toIsoDate(now) };
  }

  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: toIsoDate(from), dateTo: toIsoDate(now) };
  }

  return { dateFrom: "2000-01-01", dateTo: toIsoDate(now) };
}

export function useDashboardSummary(period: DashboardPeriod) {
  const params = periodToRange(period);

  return useQuery({
    queryKey: ["dashboard", "summary", params],
    queryFn: () =>
      callWithFallback(
        () => fetchDashboardSummary(params),
        () => getDashboardSummary(),
      ),
    placeholderData: (prev) => prev,
  });
}
