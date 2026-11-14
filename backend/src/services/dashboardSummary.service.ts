import type { AppOrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import * as reportTrackerService from "./reportTracker.service";
import type {
  DashboardPeriod,
  DashboardSummaryDto,
  LeaderboardCatalogRow,
  NewVsReturningPoint,
  RevenueTrendPoint,
} from "../types/dashboardSummary.types";

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
const LEADERBOARD_SIZE = 5;
const TREND_DAYS = 30;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function periodStart(period: DashboardPeriod, now: Date): Date | undefined {
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

async function getStats(period: DashboardPeriod, now: Date) {
  const since = periodStart(period, now);
  const createdAt = since ? { gte: since } : undefined;
  const today = startOfDay(now);

  const [
    totalBookings,
    pendingBookings,
    cancelledCount,
    earningAgg,
    todayEarningAgg,
    unassignedCount,
  ] = await Promise.all([
    prisma.appOrder.count({ where: { isDraft: false, createdAt } }),
    prisma.appOrder.count({
      where: { isDraft: false, createdAt, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.appOrder.count({ where: { isDraft: false, createdAt, status: "CANCELLED" } }),
    prisma.appOrder.aggregate({
      where: { isDraft: false, createdAt, status: NON_CANCELLED },
      _sum: { totalPayable: true },
      _count: { _all: true },
    }),
    prisma.appOrder.aggregate({
      where: { isDraft: false, createdAt: { gte: today }, status: NON_CANCELLED },
      _sum: { totalPayable: true },
    }),
    prisma.appOrder.count({
      where: { isDraft: false, phleboId: null, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
  ]);

  const unassignedOrders = await prisma.appOrder.findMany({
    where: {
      isDraft: false,
      phleboId: null,
      status: { in: ["PENDING", "CONFIRMED"] },
      addressId: { not: null },
    },
    select: { address: { select: { city: true } } },
  });
  const unassignedCityCounts = new Map<string, number>();
  for (const o of unassignedOrders) {
    const city = o.address?.city;
    if (!city) continue;
    unassignedCityCounts.set(city, (unassignedCityCounts.get(city) ?? 0) + 1);
  }
  const unassignedByCity = [...unassignedCityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city, count]) => ({ city, count }));

  const totalEarning = Number(earningAgg._sum?.totalPayable ?? 0);
  const acceptedCount = earningAgg._count._all;

  return {
    totalBookings,
    todayEarning: Number(todayEarningAgg._sum?.totalPayable ?? 0),
    totalEarning,
    pendingBookings,
    aov: acceptedCount > 0 ? Math.round((totalEarning / acceptedCount) * 100) / 100 : 0,
    cancellationRate:
      totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 1000) / 10 : 0,
    unassignedCount,
    unassignedByCity,
  };
}

async function getReportStats() {
  const { stats } = await reportTrackerService.listReportTracker({ pageSize: 1 });
  return { pendingDelivery: stats.pendingUpload, slaBreaches: stats.slaBreaches };
}

async function getOrganizationsLeaderboard(period: DashboardPeriod, now: Date) {
  const since = periodStart(period, now);
  const grouped = await prisma.appointment.groupBy({
    by: ["patientId"],
    where: since ? { createdAt: { gte: since } } : {},
    _count: true,
  });
  if (grouped.length === 0) return [];

  const patients = await prisma.patient.findMany({
    where: { id: { in: grouped.map((g) => g.patientId) }, organizationId: { not: null } },
    select: { id: true, organizationId: true },
  });
  const orgIdByPatient = new Map(patients.map((p) => [p.id, p.organizationId as string]));

  const countByOrg = new Map<string, number>();
  for (const g of grouped) {
    const orgId = orgIdByPatient.get(g.patientId);
    if (!orgId) continue;
    countByOrg.set(orgId, (countByOrg.get(orgId) ?? 0) + g._count);
  }

  const topOrgIds = [...countByOrg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, LEADERBOARD_SIZE)
    .map(([id]) => id);
  if (topOrgIds.length === 0) return [];

  const orgs = await prisma.organization.findMany({
    where: { id: { in: topOrgIds } },
    select: { id: true, name: true, city: true },
  });
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  return topOrgIds
    .map((id) => {
      const org = orgById.get(id);
      if (!org) return null;
      return { id: org.id, name: org.name, city: org.city, orderCount: countByOrg.get(id) ?? 0 };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);
}

async function getCatalogLeaderboard(
  itemType: "TEST" | "PACKAGE",
  period: DashboardPeriod,
  now: Date,
): Promise<LeaderboardCatalogRow[]> {
  const since = periodStart(period, now);
  const grouped = await prisma.appOrderItem.groupBy({
    by: ["itemId"],
    where: {
      itemType,
      order: {
        isDraft: false,
        status: NON_CANCELLED,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    },
    _count: { itemId: true },
    orderBy: { _count: { itemId: "desc" } },
    take: LEADERBOARD_SIZE,
  });
  if (grouped.length === 0) return [];

  const ids = grouped.map((g) => g.itemId);
  if (itemType === "TEST") {
    const tests = await prisma.test.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        price: true,
        department: { select: { name: true } },
        appCategory: { select: { name: true } },
      },
    });
    const byId = new Map(tests.map((t) => [t.id, t]));
    const rows: LeaderboardCatalogRow[] = [];
    for (const g of grouped) {
      const t = byId.get(g.itemId);
      if (!t) continue;
      rows.push({
        id: t.id,
        name: t.name,
        // Falls back to the CMS category for a Test with no internal
        // department — see `Test.departmentId`'s model doc-comment.
        department: t.department?.name ?? t.appCategory?.name ?? "General",
        price: Number(t.price),
        orderCount: g._count?.itemId ?? 0,
      });
    }
    return rows;
  }

  const packages = await prisma.package.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, price: true },
  });
  const byId = new Map(packages.map((p) => [p.id, p]));
  const rows: LeaderboardCatalogRow[] = [];
  for (const g of grouped) {
    const p = byId.get(g.itemId);
    if (!p) continue;
    rows.push({
      id: p.id,
      name: p.name,
      department: null,
      price: Number(p.price),
      orderCount: g._count?.itemId ?? 0,
    });
  }
  return rows;
}

async function getPhlebosLeaderboard(period: DashboardPeriod, now: Date) {
  const since = periodStart(period, now);
  const grouped = await prisma.appOrder.groupBy({
    by: ["phleboId"],
    where: {
      isDraft: false,
      phleboId: { not: null },
      status: NON_CANCELLED,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { totalPayable: true },
    orderBy: { _sum: { totalPayable: "desc" } },
    take: LEADERBOARD_SIZE,
  });
  if (grouped.length === 0) return [];

  const phlebos = await prisma.phlebotomist.findMany({
    where: { id: { in: grouped.map((g) => g.phleboId as string) } },
    select: { id: true, name: true, address: true },
  });
  const byId = new Map(phlebos.map((p) => [p.id, p]));

  return grouped
    .map((g) => {
      const p = byId.get(g.phleboId as string);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        city: p.address,
        totalEarnings: Number(g._sum?.totalPayable ?? 0),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);
}

async function getCitiesLeaderboard(period: DashboardPeriod, now: Date) {
  const since = periodStart(period, now);
  const orders = await prisma.appOrder.findMany({
    where: {
      isDraft: false,
      status: NON_CANCELLED,
      addressId: { not: null },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    select: { address: { select: { city: true } } },
  });

  const countByCity = new Map<string, number>();
  for (const o of orders) {
    const city = o.address?.city;
    if (!city) continue;
    countByCity.set(city, (countByCity.get(city) ?? 0) + 1);
  }

  return [...countByCity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, LEADERBOARD_SIZE)
    .map(([name, orderCount]) => ({ name, orderCount }));
}

async function getCustomersLeaderboard(period: DashboardPeriod, now: Date) {
  const since = periodStart(period, now);
  const grouped = await prisma.appOrder.groupBy({
    by: ["appUserId"],
    where: {
      isDraft: false,
      status: NON_CANCELLED,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { totalPayable: true },
    _count: { _all: true },
    orderBy: { _sum: { totalPayable: "desc" } },
    take: LEADERBOARD_SIZE,
  });
  if (grouped.length === 0) return [];

  const users = await prisma.appUser.findMany({
    where: { id: { in: grouped.map((g) => g.appUserId) } },
    select: { id: true, name: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const rows: { id: string; name: string | null; orderCount: number; lifetimeValue: number }[] = [];
  for (const g of grouped) {
    const u = byId.get(g.appUserId);
    if (!u) continue;
    rows.push({
      id: u.id,
      name: u.name,
      orderCount: g._count._all,
      lifetimeValue: Number(g._sum?.totalPayable ?? 0),
    });
  }
  return rows;
}

async function getBreakdowns(period: DashboardPeriod, now: Date) {
  const since = periodStart(period, now);
  const where = {
    isDraft: false,
    status: NON_CANCELLED,
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  const [byPaymentMode, byPlatform] = await Promise.all([
    prisma.appOrder.groupBy({ by: ["paymentMode"], where, _count: { _all: true } }),
    prisma.appOrder.groupBy({ by: ["platform"], where, _count: { _all: true } }),
  ]);

  return {
    paymentMode: byPaymentMode
      .filter((r) => r.paymentMode != null)
      .map((r) => ({ name: r.paymentMode as string, value: r._count._all })),
    platform: byPlatform.map((r) => ({ name: r.platform ?? "WEB", value: r._count._all })),
  };
}

async function getRevenueTrend(now: Date): Promise<RevenueTrendPoint[]> {
  const today = startOfDay(now);
  const days = Array.from({ length: TREND_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (TREND_DAYS - 1 - i));
    return d;
  });

  const sums = await Promise.all(
    days.map((day) => {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      return prisma.appOrder.aggregate({
        where: { isDraft: false, status: NON_CANCELLED, createdAt: { gte: day, lt: next } },
        _sum: { totalPayable: true },
      });
    }),
  );

  return days.map((day, i) => ({
    date: day.toISOString().slice(0, 10),
    revenue: Number(sums[i]._sum?.totalPayable ?? 0),
  }));
}

async function getNewVsReturning(now: Date): Promise<NewVsReturningPoint[]> {
  const today = startOfDay(now);
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - (TREND_DAYS - 1));

  const [ordersInRange, firstOrderByUser] = await Promise.all([
    prisma.appOrder.findMany({
      where: { isDraft: false, status: NON_CANCELLED, createdAt: { gte: rangeStart } },
      select: { appUserId: true, createdAt: true },
    }),
    prisma.appOrder.groupBy({
      by: ["appUserId"],
      where: { isDraft: false, status: NON_CANCELLED },
      _min: { createdAt: true },
    }),
  ]);

  const firstOrderAt = new Map(
    firstOrderByUser.map((f) => [f.appUserId, f._min?.createdAt as Date]),
  );

  const days = Array.from({ length: TREND_DAYS }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const usersToday = new Set(
      ordersInRange.filter((o) => o.createdAt >= day && o.createdAt < next).map((o) => o.appUserId),
    );

    let newCount = 0;
    let returningCount = 0;
    for (const userId of usersToday) {
      const first = firstOrderAt.get(userId);
      if (first && first >= day && first < next) newCount++;
      else returningCount++;
    }

    return { date: day.toISOString().slice(0, 10), new: newCount, returning: returningCount };
  });
}

export async function getDashboardSummary(period: DashboardPeriod): Promise<DashboardSummaryDto> {
  const now = new Date();

  const [
    stats,
    reportStats,
    organizations,
    tests,
    packages,
    phlebos,
    cities,
    customers,
    breakdowns,
    revenueTrend,
    newVsReturning,
  ] = await Promise.all([
    getStats(period, now),
    getReportStats(),
    getOrganizationsLeaderboard(period, now),
    getCatalogLeaderboard("TEST", period, now),
    getCatalogLeaderboard("PACKAGE", period, now),
    getPhlebosLeaderboard(period, now),
    getCitiesLeaderboard(period, now),
    getCustomersLeaderboard(period, now),
    getBreakdowns(period, now),
    getRevenueTrend(now),
    getNewVsReturning(now),
  ]);

  return {
    stats,
    reportStats,
    leaderboards: { organizations, tests, packages, phlebos, cities, customers },
    breakdowns,
    revenueTrend,
    newVsReturning,
  };
}
