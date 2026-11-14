import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { DashboardPeriod } from "@/lib/types";

export interface UnassignedCityRow {
  city: string;
  count: number;
}

export interface DashboardStats {
  totalBookings: number;
  todayEarning: number;
  totalEarning: number;
  pendingBookings: number;
  aov: number;
  cancellationRate: number;
  unassignedCount: number;
  unassignedByCity: UnassignedCityRow[];
}

export interface DashboardReportStats {
  pendingDelivery: number;
  slaBreaches: number;
}

export interface LeaderboardOrgRow {
  id: string;
  name: string;
  city: string | null;
  orderCount: number;
}

export interface LeaderboardCatalogRow {
  id: string;
  name: string;
  department: string | null;
  price: number;
  orderCount: number;
}

export interface LeaderboardPhleboRow {
  id: string;
  name: string;
  city: string | null;
  totalEarnings: number;
}

export interface LeaderboardCityRow {
  name: string;
  orderCount: number;
}

export interface LeaderboardCustomerRow {
  id: string;
  name: string | null;
  orderCount: number;
  lifetimeValue: number;
}

export interface DashboardLeaderboards {
  organizations: LeaderboardOrgRow[];
  tests: LeaderboardCatalogRow[];
  packages: LeaderboardCatalogRow[];
  phlebos: LeaderboardPhleboRow[];
  cities: LeaderboardCityRow[];
  customers: LeaderboardCustomerRow[];
}

export interface DashboardBreakdownEntry {
  name: string;
  value: number;
}

export interface DashboardBreakdowns {
  paymentMode: DashboardBreakdownEntry[];
  platform: DashboardBreakdownEntry[];
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface NewVsReturningPoint {
  date: string;
  new: number;
  returning: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  reportStats: DashboardReportStats;
  leaderboards: DashboardLeaderboards;
  breakdowns: DashboardBreakdowns;
  revenueTrend: RevenueTrendPoint[];
  newVsReturning: NewVsReturningPoint[];
}

export async function fetchDashboardSummary(period: DashboardPeriod): Promise<DashboardSummary> {
  const response = await httpClient.get<ApiResponseBody<DashboardSummary>>("/dashboard-summary", {
    params: { period },
    suppressErrorToast: true,
  });
  return response.data.data as DashboardSummary;
}
