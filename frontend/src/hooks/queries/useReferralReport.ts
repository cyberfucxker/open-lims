import { useQuery } from "@tanstack/react-query";

import {
  fetchReferralDashboard,
  fetchReferralRanking,
  fetchReferralRevenueTrend,
} from "@/services/api/referralReport.api";
import type { ReferralRankBy } from "@/types/referralReport";

export function useReferralDashboard() {
  return useQuery({
    queryKey: ["referralReports", "dashboard"],
    queryFn: () => fetchReferralDashboard(),
    staleTime: 60_000,
  });
}

export function useReferralRevenueTrend(months = 6) {
  return useQuery({
    queryKey: ["referralReports", "revenue", months],
    queryFn: () => fetchReferralRevenueTrend(months),
    staleTime: 60_000,
  });
}

export function useReferralRanking(rankBy: ReferralRankBy) {
  return useQuery({
    queryKey: ["referralReports", "ranking", rankBy],
    queryFn: () => fetchReferralRanking({ rankBy }),
    staleTime: 60_000,
  });
}
