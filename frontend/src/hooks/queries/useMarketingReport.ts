import { useQuery } from "@tanstack/react-query";

import {
  fetchDashboardSummary,
  fetchLeaderboard,
  fetchMonthlyReport,
} from "@/services/api/marketingReport.api";
import type { LeaderboardRankBy } from "@/types/marketingReport";

export function useMonthlyReport(month: number, year: number) {
  return useQuery({
    queryKey: ["marketingReport", "monthly", month, year],
    queryFn: () => fetchMonthlyReport(month, year),
  });
}

export function useLeaderboard(month: number, year: number, rankBy: LeaderboardRankBy) {
  return useQuery({
    queryKey: ["marketingReport", "leaderboard", month, year, rankBy],
    queryFn: () => fetchLeaderboard(month, year, rankBy),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["marketingReport", "dashboardSummary"],
    queryFn: () => fetchDashboardSummary(),
    staleTime: 60_000,
  });
}
