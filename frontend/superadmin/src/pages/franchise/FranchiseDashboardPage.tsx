import { useState } from "react";
import {
  BadgeIndianRupee,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { LeaderboardCard } from "@/components/charts/LeaderboardCard";
import { TrendAreaChartCard } from "@/components/charts/TrendAreaChartCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFranchiseDashboard, useFranchiseProfile } from "@/hooks/queries/useFranchise";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { FranchisePeriod } from "@/services/api/franchiseApi";
import { cn } from "@/utils/cn";

import { ORDER_STATUS_BADGE } from "./orderStatus";

const PERIODS: { value: FranchisePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

function PeriodToggle({
  value,
  onChange,
}: {
  value: FranchisePeriod;
  onChange: (p: FranchisePeriod) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Dashboard period"
      className="flex items-center gap-1 rounded-xl border border-border bg-secondary/40 p-1"
    >
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          role="radio"
          aria-checked={value === p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            value === p.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  );
}

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function FranchiseDashboardPage() {
  const [period, setPeriod] = useState<FranchisePeriod>("month");
  const { data: profile } = useFranchiseProfile();
  const { data, isLoading } = useFranchiseDashboard(period);

  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={profile ? `Welcome, ${profile.name}` : "Dashboard"}
        description="Your orders, revenue and reports at a glance."
        actions={<PeriodToggle value={period} onChange={setPeriod} />}
      />

      {/* Orders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading || !stats ? (
          Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Today's Orders"
              value={formatNumber(stats.todayOrders)}
              icon={CalendarCheck}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Total Orders"
              value={formatNumber(stats.totalOrders)}
              icon={ShoppingCart}
              gradient="bg-sky-500"
              index={1}
            />
            <StatCard
              title="Pending Orders"
              value={formatNumber(stats.pendingOrders)}
              icon={Clock}
              gradient="bg-amber-500"
              index={2}
              alert={stats.pendingOrders > 0}
            />
            <StatCard
              title="Completed Orders"
              value={formatNumber(stats.completedOrders)}
              icon={CheckCircle2}
              gradient="bg-emerald-500"
              index={3}
            />
            <StatCard
              title="Cancelled Orders"
              value={formatNumber(stats.cancelledOrders)}
              icon={XCircle}
              gradient="bg-rose-500"
              index={4}
            />
          </>
        )}
      </div>

      {/* Money + reports */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(stats.todayRevenue)}
              icon={IndianRupee}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(stats.monthlyRevenue)}
              icon={TrendingUp}
              gradient="bg-violet-500"
              index={1}
            />
            <StatCard
              title="Total Earnings"
              value={formatCurrency(stats.totalEarnings)}
              icon={BadgeIndianRupee}
              gradient="bg-emerald-500"
              index={2}
            />
            <StatCard
              title="Pending Reports"
              value={formatNumber(stats.pendingReports)}
              icon={FileText}
              gradient="bg-amber-500"
              index={3}
              alert={stats.pendingReports > 0}
            />
          </>
        )}
      </div>

      {/* Revenue trend */}
      {isLoading || !data ? (
        <PanelSkeleton />
      ) : (
        <TrendAreaChartCard title="Revenue — last 30 days" data={data.revenueTrend} />
      )}

      {/* Top sellers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading || !data ? (
          <>
            <PanelSkeleton />
            <PanelSkeleton />
          </>
        ) : (
          <>
            <LeaderboardCard
              title="Top Selling Tests"
              items={data.topTests.map((t) => ({
                id: t.id,
                primary: t.name,
                secondary: `${formatNumber(t.orderCount)} order${t.orderCount === 1 ? "" : "s"}`,
                value: t.revenue,
                valueLabel: formatCurrency(t.revenue),
              }))}
            />
            <LeaderboardCard
              title="Top Packages"
              barColor="var(--chart-2)"
              items={data.topPackages.map((p) => ({
                id: p.id,
                primary: p.name,
                secondary: `${formatNumber(p.orderCount)} order${p.orderCount === 1 ? "" : "s"}`,
                value: p.revenue,
                valueLabel: formatCurrency(p.revenue),
              }))}
            />
          </>
        )}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/franchise/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/70">
              {data.recentOrders.map((order) => {
                const badge = ORDER_STATUS_BADGE[order.status] ?? {
                  label: order.status,
                  variant: "outline" as const,
                };
                return (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="font-mono text-xs tracking-wider text-muted-foreground">
                      {order.orderNumber}
                    </span>
                    <div className="flex min-w-[140px] flex-col leading-tight">
                      <span className="text-sm font-medium text-foreground">
                        {order.customerName ?? "—"}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {order.customerMobile}
                      </span>
                    </div>
                    <span className="hidden max-w-[280px] truncate text-xs text-muted-foreground md:block">
                      {order.itemSummary || "—"}
                    </span>
                    <Badge variant={badge.variant} className="ml-auto">
                      {badge.label}
                    </Badge>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(order.totalPayable)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { FranchiseDashboardPage };
