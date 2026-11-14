import type { AppOrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { franchiseOrderScope } from "./franchiseOrderScope";
import type {
  FranchiseDashboardDto,
  FranchisePeriod,
  FranchiseRecentOrder,
  FranchiseTopItem,
} from "../types/franchise.types";

/**
 * Franchise-scoped variant of `dashboardSummary.service.ts`.
 *
 * Deliberately a separate service rather than a shared, optionally-filtered
 * one. The admin dashboard answers different questions — unassigned-by-city,
 * phlebo earnings, new-vs-returning customers, platform split — none of which a
 * single franchise can act on. Generalising the two into one parameterised
 * service would mean every future admin widget has to reason about whether it
 * is safe under a franchise scope, which is exactly the kind of thinking that
 * eventually leaks another franchise's data into this response.
 *
 * Every query here filters on `organizationId`, which the caller takes from
 * `req.franchise` and never from client input.
 */

const NON_CANCELLED_STATUSES: AppOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
  "COMPLETED",
];
const NON_CANCELLED: Prisma.EnumAppOrderStatusFilter = { in: NON_CANCELLED_STATUSES };
const PENDING_STATUSES: AppOrderStatus[] = ["PENDING", "CONFIRMED"];
const TOP_ITEMS = 5;
const RECENT_ORDERS = 8;
const TREND_DAYS = 30;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodStart(period: FranchisePeriod, now: Date): Date | undefined {
  const today = startOfDay(now);
  if (period === "today") return today;
  if (period === "week") {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d;
  }
  if (period === "month") {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return d;
  }
  return undefined;
}

async function getStats(organizationId: string, period: FranchisePeriod, now: Date) {
  const since = periodStart(period, now);
  const createdAt = since ? { gte: since } : undefined;
  const today = startOfDay(now);
  const monthStart = new Date(today);
  monthStart.setDate(monthStart.getDate() - 29);

  // `scoped` is spread into every where-clause below. Defining it once means a
  // new widget cannot forget the franchise filter. Includes area-assigned
  // orders as well as directly-stamped ones — see `franchiseOrderScope`.
  const scoped = { ...franchiseOrderScope(organizationId), isDraft: false };

  const [
    totalOrders,
    periodOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalEarningAgg,
    todayRevenueAgg,
    monthlyRevenueAgg,
    pendingReports,
  ] = await Promise.all([
    prisma.appOrder.count({ where: scoped }),
    prisma.appOrder.count({ where: { ...scoped, createdAt } }),
    prisma.appOrder.count({ where: { ...scoped, createdAt: { gte: today } } }),
    prisma.appOrder.count({ where: { ...scoped, status: { in: PENDING_STATUSES } } }),
    prisma.appOrder.count({ where: { ...scoped, status: "COMPLETED" } }),
    prisma.appOrder.count({ where: { ...scoped, status: "CANCELLED" } }),
    prisma.appOrder.aggregate({
      where: { ...scoped, status: NON_CANCELLED },
      _sum: { totalPayable: true },
    }),
    prisma.appOrder.aggregate({
      where: { ...scoped, status: NON_CANCELLED, createdAt: { gte: today } },
      _sum: { totalPayable: true },
    }),
    prisma.appOrder.aggregate({
      where: { ...scoped, status: NON_CANCELLED, createdAt: { gte: monthStart } },
      _sum: { totalPayable: true },
    }),
    // Reports reach a franchise through its patients, not through AppOrder —
    // a report exists per Appointment, including walk-ins with no order.
    prisma.report.count({
      where: {
        appointment: { patient: { organizationId } },
        status: { notIn: ["SUBMITTED", "PRINTED", "CANCELLED"] },
      },
    }),
  ]);

  return {
    todayOrders,
    totalOrders,
    periodOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    todayRevenue: Number(todayRevenueAgg._sum?.totalPayable ?? 0),
    monthlyRevenue: Number(monthlyRevenueAgg._sum?.totalPayable ?? 0),
    totalEarnings: Number(totalEarningAgg._sum?.totalPayable ?? 0),
    pendingReports,
  };
}

async function getRevenueTrend(
  organizationId: string,
  now: Date,
): Promise<{ date: string; revenue: number }[]> {
  const since = new Date(startOfDay(now));
  since.setDate(since.getDate() - (TREND_DAYS - 1));

  const orders = await prisma.appOrder.findMany({
    where: {
      ...franchiseOrderScope(organizationId),
      isDraft: false,
      status: NON_CANCELLED,
      createdAt: { gte: since },
    },
    select: { createdAt: true, totalPayable: true },
  });

  // Pre-seed every day so the chart has a continuous x-axis rather than
  // collapsing gaps — a franchise with sparse orders would otherwise get a
  // misleadingly smooth line.
  const byDay = new Map<string, number>();
  for (let i = 0; i < TREND_DAYS; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + Number(order.totalPayable));
    }
  }

  return [...byDay.entries()].map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

/** Top tests and packages by how often this franchise's orders included them.
 *  Read from `AppOrderItem`, which snapshots what was actually selected — a
 *  package stays one line rather than expanding into its member tests. */
async function getTopItems(
  organizationId: string,
): Promise<{ tests: FranchiseTopItem[]; packages: FranchiseTopItem[] }> {
  const rows = await prisma.appOrderItem.findMany({
    where: {
      order: { ...franchiseOrderScope(organizationId), isDraft: false, status: NON_CANCELLED },
    },
    select: { itemType: true, itemId: true, name: true, price: true },
  });

  const tally = new Map<string, FranchiseTopItem & { itemType: string }>();
  for (const row of rows) {
    const key = `${row.itemType}:${row.itemId}`;
    const existing = tally.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.revenue += Number(row.price);
    } else {
      tally.set(key, {
        itemType: row.itemType,
        id: row.itemId,
        name: row.name,
        orderCount: 1,
        revenue: Number(row.price),
      });
    }
  }

  const sorted = [...tally.values()].sort((a, b) => b.orderCount - a.orderCount);
  const strip = ({ itemType: _itemType, ...item }: (typeof sorted)[number]) => item;

  return {
    tests: sorted
      .filter((i) => i.itemType === "TEST")
      .slice(0, TOP_ITEMS)
      .map(strip),
    packages: sorted
      .filter((i) => i.itemType === "PACKAGE")
      .slice(0, TOP_ITEMS)
      .map(strip),
  };
}

async function getRecentOrders(organizationId: string): Promise<FranchiseRecentOrder[]> {
  const orders = await prisma.appOrder.findMany({
    where: { ...franchiseOrderScope(organizationId), isDraft: false },
    orderBy: { createdAt: "desc" },
    take: RECENT_ORDERS,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalPayable: true,
      createdAt: true,
      appUser: { select: { name: true, mobile: true } },
      items: { select: { name: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.appUser.name,
    customerMobile: order.appUser.mobile,
    itemSummary: [...new Set(order.items.map((i) => i.name))].join(", "),
    status: order.status,
    totalPayable: Number(order.totalPayable),
    createdAt: order.createdAt.toISOString(),
  }));
}

export async function getFranchiseDashboard(
  organizationId: string,
  period: FranchisePeriod,
): Promise<FranchiseDashboardDto> {
  const now = new Date();

  const [stats, revenueTrend, topItems, recentOrders] = await Promise.all([
    getStats(organizationId, period, now),
    getRevenueTrend(organizationId, now),
    getTopItems(organizationId),
    getRecentOrders(organizationId),
  ]);

  return {
    stats,
    revenueTrend,
    topTests: topItems.tests,
    topPackages: topItems.packages,
    recentOrders,
  };
}
