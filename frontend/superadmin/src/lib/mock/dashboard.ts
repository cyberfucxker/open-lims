import type { DashboardPeriod } from "@/lib/types";
import { cities } from "./cities";
import { customers } from "./customers";
import { organizations } from "./organizations";
import { orders } from "./orders";
import { packages, tests } from "./tests";
import { phlebos } from "./phlebos";
import { reportDeliveries } from "./audit";
import { randInt } from "./generators";

const NOW = new Date("2026-07-23T09:00:00").getTime();

function withinPeriod(iso: string, period: DashboardPeriod): boolean {
  if (period === "all") return true;
  const days = period === "today" ? 1 : period === "week" ? 7 : 30;
  return NOW - new Date(iso).getTime() <= days * 24 * 3600 * 1000;
}

export function getOrdersForPeriod(period: DashboardPeriod) {
  return orders.filter((o) => withinPeriod(o.createdAt, period));
}

export function getDashboardStats(period: DashboardPeriod) {
  const periodOrders = getOrdersForPeriod(period);
  const paidOrders = periodOrders.filter((o) => o.paymentStatus === "paid");
  const totalEarning = paidOrders.reduce((s, o) => s + (o.amount - o.discount), 0);
  const todayOrders = getOrdersForPeriod("today");
  const todayEarning = todayOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + (o.amount - o.discount), 0);
  const pendingOrders = periodOrders.filter(
    (o) => o.status === "pending" || o.status === "confirmed",
  );
  const unassigned = orders.filter(
    (o) => !o.phleboId && o.status !== "cancelled" && o.status !== "delivered",
  );
  const cancelled = periodOrders.filter((o) => o.status === "cancelled");
  const aov = paidOrders.length ? Math.round(totalEarning / paidOrders.length) : 0;

  return {
    totalBookings: periodOrders.length,
    todayEarning,
    totalEarning,
    pendingBookings: pendingOrders.length,
    unassignedCount: unassigned.length,
    cancellationRate: periodOrders.length
      ? Math.round((cancelled.length / periodOrders.length) * 1000) / 10
      : 0,
    aov,
  };
}

export function getTopOrganizations(limit = 5) {
  return [...organizations].sort((a, b) => b.orderCount - a.orderCount).slice(0, limit);
}

export function getTopTests(limit = 5) {
  return [...tests].sort((a, b) => b.orderCount - a.orderCount).slice(0, limit);
}

export function getTopPackages(limit = 5) {
  return [...packages].sort((a, b) => b.orderCount - a.orderCount).slice(0, limit);
}

export function getTopPhlebos(limit = 5) {
  return [...phlebos].sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, limit);
}

export function getTopCities(limit = 5) {
  return [...cities].sort((a, b) => b.orderCount - a.orderCount).slice(0, limit);
}

export function getTopCustomers(limit = 5) {
  return [...customers].sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, limit);
}

export function getPaymentModeBreakdown(period: DashboardPeriod) {
  const periodOrders = getOrdersForPeriod(period);
  const online = periodOrders.filter((o) => o.paymentMode === "online").length;
  const cod = periodOrders.filter((o) => o.paymentMode === "cod").length;
  const wallet = periodOrders.filter((o) => o.paymentMode === "wallet").length;
  return [
    { name: "Online", value: online, color: "var(--chart-1)" },
    { name: "COD", value: cod, color: "var(--chart-3)" },
    { name: "Wallet", value: wallet, color: "var(--chart-2)" },
  ];
}

export function getSourceBreakdown(period: DashboardPeriod) {
  const periodOrders = getOrdersForPeriod(period);
  const android = periodOrders.filter((o) => o.source === "android").length;
  const ios = periodOrders.filter((o) => o.source === "ios").length;
  const web = periodOrders.filter((o) => o.source === "web").length;
  return [
    { name: "Android", value: android, color: "var(--chart-6)" },
    { name: "iOS", value: ios, color: "var(--chart-4)" },
    { name: "Web", value: web, color: "var(--chart-5)" },
  ];
}

export function getRevenueTrend(days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const offset = days - 1 - i;
    const d = new Date(NOW - offset * 24 * 3600 * 1000);
    const dayOrders = orders.filter((o) => {
      const diff = Math.floor((NOW - new Date(o.createdAt).getTime()) / (24 * 3600 * 1000));
      return diff === offset && o.paymentStatus === "paid";
    });
    return {
      date: d.toISOString().slice(5, 10),
      revenue: dayOrders.reduce((s, o) => s + (o.amount - o.discount), 0) || randInt(8000, 45000),
    };
  });
}

export function getNewVsReturning(days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const offset = days - 1 - i;
    const d = new Date(NOW - offset * 24 * 3600 * 1000);
    return {
      date: d.toISOString().slice(5, 10),
      new: randInt(15, 90),
      returning: randInt(20, 120),
    };
  });
}

export function getSlaStats() {
  const pendingDelivery = reportDeliveries.filter((r) => r.status !== "downloaded").length;
  const breached = reportDeliveries.filter((r) => r.slaBreached).length;
  return { pendingDelivery, breached, totalTracked: reportDeliveries.length };
}

export const appRatingSnapshot = {
  playStore: 4.4,
  appStore: 4.6,
  totalReviews: 18420,
  trend: [4.2, 4.3, 4.3, 4.4, 4.4, 4.5, 4.4],
};
