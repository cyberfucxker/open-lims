import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  DashboardSummary,
  LeaderboardRankBy,
  LeaderboardResult,
  MonthlyReportResult,
} from "@/types/marketingReport";

export async function fetchMonthlyReport(
  month: number,
  year: number,
): Promise<MonthlyReportResult> {
  const response = await httpClient.get<ApiResponseBody<MonthlyReportResult>>(
    "/marketing-report/monthly",
    { params: { month, year } },
  );
  return response.data.data as MonthlyReportResult;
}

export async function fetchLeaderboard(
  month: number,
  year: number,
  rankBy?: LeaderboardRankBy,
): Promise<LeaderboardResult> {
  const response = await httpClient.get<ApiResponseBody<LeaderboardResult>>(
    "/marketing-report/leaderboard",
    { params: { month, year, rankBy } },
  );
  return response.data.data as LeaderboardResult;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await httpClient.get<ApiResponseBody<DashboardSummary>>(
    "/marketing-report/dashboard-summary",
  );
  return response.data.data as DashboardSummary;
}

export async function fetchMonthlyReportExcelBlob(month: number, year: number): Promise<Blob> {
  const response = await httpClient.get("/marketing-report/monthly/export", {
    params: { month, year },
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}
