export type DashboardPeriod = "today" | "week" | "month" | "all";

export interface UnassignedCityRow {
  city: string;
  count: number;
}

export interface DashboardStatsDto {
  totalBookings: number;
  todayEarning: number;
  totalEarning: number;
  pendingBookings: number;
  aov: number;
  cancellationRate: number;
  unassignedCount: number;
  unassignedByCity: UnassignedCityRow[];
}

export interface DashboardReportStatsDto {
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

export interface DashboardLeaderboardsDto {
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

export interface DashboardBreakdownsDto {
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

export interface DashboardSummaryDto {
  stats: DashboardStatsDto;
  reportStats: DashboardReportStatsDto;
  leaderboards: DashboardLeaderboardsDto;
  breakdowns: DashboardBreakdownsDto;
  revenueTrend: RevenueTrendPoint[];
  newVsReturning: NewVsReturningPoint[];
}
