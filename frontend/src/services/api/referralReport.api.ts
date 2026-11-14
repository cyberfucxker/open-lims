import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  MonthlyRevenuePoint,
  ReferralDashboardSummary,
  ReferralRankingParams,
  ReferralRankingRow,
} from "@/types/referralReport";

export async function fetchReferralDashboard(): Promise<ReferralDashboardSummary> {
  const response = await httpClient.get<ApiResponseBody<ReferralDashboardSummary>>(
    "/referral-reports/dashboard",
  );
  return response.data.data as ReferralDashboardSummary;
}

export async function fetchReferralRevenueTrend(months = 6): Promise<MonthlyRevenuePoint[]> {
  const response = await httpClient.get<ApiResponseBody<MonthlyRevenuePoint[]>>(
    "/referral-reports/revenue",
    { params: { months } },
  );
  return response.data.data as MonthlyRevenuePoint[];
}

export async function fetchReferralRanking(
  params: ReferralRankingParams = {},
): Promise<ReferralRankingRow[]> {
  const response = await httpClient.get<ApiResponseBody<ReferralRankingRow[]>>(
    "/referral-reports/ranking",
    { params },
  );
  return response.data.data as ReferralRankingRow[];
}
