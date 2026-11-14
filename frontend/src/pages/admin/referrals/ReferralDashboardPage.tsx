import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IndianRupee, Network, Percent, Receipt, Share2, Users } from "lucide-react";

import { ChartCard } from "@/components/common/ChartCard";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatCardSkeleton } from "@/components/common/StatCardSkeleton";
import { ReferralLeaderboardCard } from "@/components/referrals/ReferralLeaderboardCard";
import { ReferralTypeDistributionChart } from "@/components/referrals/ReferralTypeDistributionChart";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReferralDashboard, useReferralRevenueTrend } from "@/hooks/queries/useReferralReport";
import type { SettlementStatus } from "@/types/referralReport";

function formatInr(value: number) {
  return `₹${Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatCompactInr(value: number) {
  return `₹${Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const SETTLEMENT_STATUS_BADGE: Record<SettlementStatus, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  PAID: "success",
  CANCELLED: "destructive",
};

function ReferralDashboardPage() {
  const { data: dashboard, isLoading: isDashboardLoading } = useReferralDashboard();
  const { data: revenueTrend, isLoading: isRevenueLoading } = useReferralRevenueTrend(6);

  const typeDistribution = dashboard?.typeDistribution ?? [];
  const recentSettlements = dashboard?.recentSettlements ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Referral Dashboard"
        description="Overview of referral sources, revenue, and settlements."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {isDashboardLoading || !dashboard
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : [
              {
                label: "Total Referrals",
                value: dashboard.totalReferrals,
                icon: Share2,
                color: "bg-blue-500",
              },
              {
                label: "Active Referrals",
                value: dashboard.activeReferrals,
                icon: Network,
                color: "bg-indigo-500",
              },
              {
                label: "Patients",
                value: dashboard.patients,
                icon: Users,
                color: "bg-sky-500",
              },
              {
                label: "Revenue",
                value: dashboard.revenue,
                icon: IndianRupee,
                prefix: "₹",
                color: "bg-emerald-500",
              },
              {
                label: "Commission",
                value: dashboard.commission,
                icon: Percent,
                prefix: "₹",
                color: "bg-amber-500",
              },
              {
                label: "Settlements",
                value: dashboard.settlements,
                icon: Receipt,
                color: "bg-purple-500",
              },
            ].map((card, i) => <StatCard key={card.label} index={i} {...card} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Revenue" description="Last 6 months" delay={0.1}>
          {isRevenueLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !revenueTrend || revenueTrend.length === 0 ? (
            <EmptyState title="No data" description="No referral revenue recorded yet." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="referral-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="0" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: "var(--chart-axis)" }}
                    tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={formatCompactInr}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
                    width={56}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
                    content={({ active, label, payload }) => (
                      <ChartTooltip
                        active={active}
                        label={label ? String(label) : undefined}
                        payload={payload?.map((p) => ({
                          name: "Revenue",
                          value: Number(p.value),
                          color: "var(--chart-1)",
                        }))}
                        formatValue={formatCompactInr}
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#referral-revenue-fill)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Referral Type Distribution"
          description="All-time, active sources"
          delay={0.15}
        >
          {isDashboardLoading || !dashboard ? (
            <Skeleton className="h-56 w-full" />
          ) : typeDistribution.length === 0 ? (
            <EmptyState title="No data" description="No referral sources recorded yet." />
          ) : (
            <ReferralTypeDistributionChart data={typeDistribution} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReferralLeaderboardCard />

        <ChartCard title="Recent Settlements" description="Last 5 settlements">
          {isDashboardLoading || !dashboard ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : recentSettlements.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No settlements yet"
              description="No referral settlements have been generated yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-medium text-navy-950">
                      {settlement.referralSourceName}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatInr(settlement.finalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={SETTLEMENT_STATUS_BADGE[settlement.settlementStatus]}>
                        {settlement.settlementStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatDate(settlement.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

export { ReferralDashboardPage };
