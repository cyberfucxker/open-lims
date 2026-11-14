import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { DashboardQueryParams, DashboardSummary } from "@/types/dashboard";

/** Real `/dashboard/summary` endpoint. */
export async function fetchDashboardSummary(
  params: DashboardQueryParams,
): Promise<DashboardSummary> {
  const response = await httpClient.get<ApiResponseBody<DashboardSummary>>("/dashboard/summary", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as DashboardSummary;
}
