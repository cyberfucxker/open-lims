import { MOCK_DASHBOARD_SUMMARY } from "@/data/mockDashboardSummary";
import { delay } from "@/services/mock/delay";
import type { DashboardSummary } from "@/types/dashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay(650);
  return MOCK_DASHBOARD_SUMMARY;
}
