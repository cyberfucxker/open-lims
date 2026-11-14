import type { AppOrderStatus, PriceListItemType } from "@prisma/client";
import type { FranchiseType } from "./organization.types";

export const FRANCHISE_PERIODS = ["today", "week", "month", "all"] as const;
export type FranchisePeriod = (typeof FRANCHISE_PERIODS)[number];

export const PRICE_LIST_ITEM_TYPES = ["TEST", "PACKAGE", "PARAMETER"] as const;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface FranchiseDashboardStats {
  todayOrders: number;
  totalOrders: number;
  /** Orders inside the selected period — `totalOrders` ignores the period so
   *  the "lifetime" tile stays stable while the rest of the page filters. */
  periodOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalEarnings: number;
  pendingReports: number;
}

export interface FranchiseTopItem {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export interface FranchiseRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerMobile: string;
  itemSummary: string;
  status: AppOrderStatus;
  totalPayable: number;
  createdAt: string;
}

export interface FranchiseDashboardDto {
  stats: FranchiseDashboardStats;
  revenueTrend: { date: string; revenue: number }[];
  topTests: FranchiseTopItem[];
  topPackages: FranchiseTopItem[];
  recentOrders: FranchiseRecentOrder[];
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface FranchiseProfileDto {
  id: string;
  code: string;
  name: string;
  ownerName: string | null;
  mobile: string;
  email: string | null;
  cityName: string | null;
  franchiseType: FranchiseType;
  labName: string | null;
  labLogoPath: string | null;
  priceListName: string | null;
  username: string | null;
  commissionPct: number;
  createdAt: string;
}

/** Only the fields a franchise may change about itself. Notably absent: code,
 *  price list, commission, active — all admin-controlled. */
export interface FranchiseProfileWriteData {
  ownerName?: string | null;
  mobile?: string;
  email?: string | null;
  /** Ignored unless the franchise is CO_LAB — a Single Lab renders Example Diagnostics Lab's
   *  branding and has no lab name of its own to set. */
  labName?: string | null;
}

// ---------------------------------------------------------------------------
// Price list
// ---------------------------------------------------------------------------

export interface FranchisePriceListItemDto {
  itemType: PriceListItemType;
  itemId: string;
  name: string;
  /** Catalogue selling price — what applies with no override. */
  catalogPrice: number;
  /** The franchise's override, or null when it has not set one. */
  overridePrice: number | null;
  effectivePrice: number;
  /** Whether this franchise offers the item at all — false removes it from
   *  this franchise's city catalogue if it happens to be the city's parent
   *  franchise (see `City.parentOrganizationId`). Defaults to true. */
  isOffered: boolean;
}

export interface FranchisePriceListDto {
  id: string;
  name: string;
  itemsByType: {
    TEST: FranchisePriceListItemDto[];
    PACKAGE: FranchisePriceListItemDto[];
    PARAMETER: FranchisePriceListItemDto[];
  };
}

export interface FranchisePriceListItemWrite {
  itemType: PriceListItemType;
  itemId: string;
  price: number;
  isOffered: boolean;
}
