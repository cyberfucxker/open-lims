import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CalendarCheck,
  Clock,
  FileText,
  FlaskConical,
  IndianRupee,
  MapPin,
  Package,
  Percent,
  Syringe,
  Users,
} from "lucide-react";

import { AvatarChip } from "@/components/common/AvatarChip";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { DonutChartCard } from "@/components/charts/DonutChartCard";
import { LeaderboardCard } from "@/components/charts/LeaderboardCard";
import { TrendAreaChartCard } from "@/components/charts/TrendAreaChartCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/hooks/queries/useDashboardSummary";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardPeriod } from "@/lib/types";
import { cn } from "@/utils/cn";

import { NewVsReturningChart } from "./NewVsReturningChart";
import { SlotHeatmapMini } from "./SlotHeatmapMini";
import { UnassignedAlertCard } from "./UnassignedAlertCard";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

function PeriodToggle({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
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
  return <Skeleton className={cn("h-64 rounded-2xl", className)} />;
}

function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const summaryQuery = useDashboardSummary(period);

  const isLoading = summaryQuery.isLoading;
  const data = summaryQuery.data;
  const stats = data?.stats;
  const reportStats = data?.reportStats;
  const leaderboards = data?.leaderboards;
  const breakdowns = data?.breakdowns;

  const paymentBreakdown =
    breakdowns?.paymentMode.map((b) => ({
      name: b.name === "CASH" ? "Cash" : "Online",
      value: b.value,
      color: b.name === "CASH" ? "var(--chart-2)" : "var(--chart-1)",
    })) ?? [];

  const platformColors: Record<string, string> = {
    ANDROID: "var(--chart-1)",
    IOS: "var(--chart-2)",
    WEB: "var(--chart-3)",
  };
  const sourceBreakdown =
    breakdowns?.platform.map((b) => ({
      name: b.name.charAt(0) + b.name.slice(1).toLowerCase(),
      value: b.value,
      color: platformColors[b.name] ?? "var(--chart-3)",
    })) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        description="Here's what's happening across the Example Lab patient app today."
        actions={<PeriodToggle value={period} onChange={setPeriod} />}
      />

      {summaryQuery.isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {summaryQuery.error instanceof Error
              ? summaryQuery.error.message
              : "Failed to load dashboard data."}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => summaryQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Bookings"
              value={formatNumber(stats?.totalBookings ?? 0)}
              icon={CalendarCheck}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Today's Earning"
              value={formatCurrency(stats?.todayEarning ?? 0)}
              icon={IndianRupee}
              gradient="bg-emerald-500"
              index={1}
            />
            <StatCard
              title="Total Earning"
              value={formatCurrency(stats?.totalEarning ?? 0)}
              icon={IndianRupee}
              gradient="bg-violet-500"
              index={2}
            />
            <StatCard
              title="Pending Bookings"
              value={formatNumber(stats?.pendingBookings ?? 0)}
              icon={Clock}
              gradient="bg-amber-500"
              index={3}
              alert={(stats?.pendingBookings ?? 0) > 20}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Average Order Value"
              value={formatCurrency(stats?.aov ?? 0)}
              icon={Percent}
              gradient="bg-sky-500"
              index={0}
            />
            <StatCard
              title="Cancellation Rate"
              value={`${stats?.cancellationRate ?? 0}%`}
              icon={AlertOctagon}
              gradient="bg-rose-500"
              index={1}
              alert={(stats?.cancellationRate ?? 0) > 8}
            />
            <StatCard
              title="Reports Pending Delivery"
              value={formatNumber(reportStats?.pendingDelivery ?? 0)}
              icon={FileText}
              gradient="bg-cyan-500"
              index={2}
            />
            <StatCard
              title="SLA Breach Alerts"
              value={formatNumber(reportStats?.slaBreaches ?? 0)}
              icon={AlertOctagon}
              gradient="bg-orange-500"
              index={3}
              alert={(reportStats?.slaBreaches ?? 0) > 0}
            />
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Leaderboards
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <PanelSkeleton key={i} />)
          ) : (
            <>
              <LeaderboardCard
                title="Top Organizations"
                viewAllPath="/organizations"
                barColor="var(--chart-1)"
                items={(leaderboards?.organizations ?? []).map((o) => ({
                  id: o.id,
                  primary: o.name,
                  secondary: o.city ?? undefined,
                  value: o.orderCount,
                  valueLabel: formatNumber(o.orderCount),
                  avatar: (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-4" />
                    </div>
                  ),
                }))}
              />
              <LeaderboardCard
                title="Top Tests"
                viewAllPath="/tests-packages"
                barColor="var(--chart-4)"
                items={(leaderboards?.tests ?? []).map((t) => ({
                  id: t.id,
                  primary: t.name,
                  secondary: t.department ?? undefined,
                  value: t.orderCount,
                  valueLabel: formatNumber(t.orderCount),
                  avatar: (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                      <FlaskConical className="size-4" />
                    </div>
                  ),
                }))}
              />
              <LeaderboardCard
                title="Top Packages"
                viewAllPath="/tests-packages"
                barColor="var(--chart-2)"
                items={(leaderboards?.packages ?? []).map((p) => ({
                  id: p.id,
                  primary: p.name,
                  secondary: `${formatCurrency(p.price)} package price`,
                  value: p.orderCount,
                  valueLabel: formatNumber(p.orderCount),
                  avatar: (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                      <Package className="size-4" />
                    </div>
                  ),
                }))}
              />
              <LeaderboardCard
                title="Top Phlebotomists"
                viewAllPath="/phlebos"
                barColor="var(--chart-5)"
                items={(leaderboards?.phlebos ?? []).map((p) => ({
                  id: p.id,
                  primary: p.name,
                  secondary: p.city ?? undefined,
                  value: p.totalEarnings,
                  valueLabel: formatCurrency(p.totalEarnings),
                  avatar: <AvatarChip name={p.name} subtitle="" />,
                }))}
              />
              <LeaderboardCard
                title="Top Cities"
                viewAllPath="/cities-areas"
                barColor="var(--chart-3)"
                items={(leaderboards?.cities ?? []).map((c) => ({
                  id: c.name,
                  primary: c.name,
                  secondary: undefined,
                  value: c.orderCount,
                  valueLabel: formatNumber(c.orderCount),
                  avatar: (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <MapPin className="size-4" />
                    </div>
                  ),
                }))}
              />
              <LeaderboardCard
                title="Top Customers"
                viewAllPath="/customers"
                barColor="var(--chart-6)"
                items={(leaderboards?.customers ?? []).map((c) => ({
                  id: c.id,
                  primary: c.name ?? "Unnamed",
                  secondary: `${c.orderCount} orders`,
                  value: c.lifetimeValue,
                  valueLabel: formatCurrency(c.lifetimeValue),
                  avatar: (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-violet/10 text-brand-violet">
                      <Users className="size-4" />
                    </div>
                  ),
                }))}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {isLoading ? (
          <>
            <PanelSkeleton />
            <PanelSkeleton />
            <PanelSkeleton />
          </>
        ) : (
          <>
            <UnassignedAlertCard
              count={stats?.unassignedCount ?? 0}
              topCities={stats?.unassignedByCity ?? []}
            />
            <DonutChartCard
              title="Payment Mode Breakdown"
              data={paymentBreakdown}
              centerLabel="Orders"
            />
            <DonutChartCard
              title="Booking Source Breakdown"
              data={sourceBreakdown}
              centerLabel="Orders"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {isLoading ? (
            <PanelSkeleton className="h-[340px]" />
          ) : (
            <TrendAreaChartCard
              title="Revenue Trend — Last 30 Days"
              data={data?.revenueTrend ?? []}
            />
          )}
        </div>
        {isLoading ? (
          <PanelSkeleton className="h-[340px]" />
        ) : (
          <NewVsReturningChart data={data?.newVsReturning ?? []} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">{isLoading ? <PanelSkeleton /> : <SlotHeatmapMini />}</div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-2 pb-4 text-xs text-muted-foreground">
        <Syringe className="size-3.5" />
        Dashboard data is live.
      </div>
    </div>
  );
}

export { DashboardPage };
