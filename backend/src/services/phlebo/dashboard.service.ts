import { prisma } from "../../config/database";
import { listTodayBookings, toBookingSummary, type BookingSummaryDto } from "./booking.service";

export interface DashboardStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  refund: number;
  completed: number;
}

export async function getStats(phleboId: string): Promise<DashboardStats> {
  const groups = await prisma.appOrder.groupBy({
    by: ["status"],
    where: { phleboId, isDraft: false },
    _count: true,
  });

  const countOf = (...statuses: string[]) =>
    groups.filter((g) => statuses.includes(g.status)).reduce((sum, g) => sum + g._count, 0);

  return {
    total: groups.reduce((sum, g) => sum + g._count, 0),
    pending: countOf("PENDING", "CONFIRMED"),
    accepted: countOf("ACCEPTED"),
    rejected: countOf("REJECTED"),
    refund: countOf("CANCELLED"),
    completed: countOf("COMPLETED"),
  };
}

export interface DashboardResult {
  date: string;
  stats: DashboardStats;
  today_orders: BookingSummaryDto[];
}

export async function getDashboard(phleboId: string): Promise<DashboardResult> {
  const [stats, today] = await Promise.all([getStats(phleboId), listTodayBookings(phleboId)]);

  return {
    date: new Date().toISOString().slice(0, 10),
    stats,
    today_orders: today.bookings.map(toBookingSummary),
  };
}
