import { useState } from "react";
import { CalendarCheck, ClipboardList, IndianRupee } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { B2BPanel } from "@/components/dashboard/B2BPanel";
import { HeroStatCard } from "@/components/dashboard/HeroStatCard";
import { PaymentBreakdownPanel } from "@/components/dashboard/PaymentBreakdownPanel";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import { SupportRow } from "@/components/dashboard/SupportRow";
import { TopReferralsPanel } from "@/components/dashboard/TopReferralsPanel";
import { TopTestsPanel } from "@/components/dashboard/TopTestsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardSummary } from "@/hooks/queries/useDashboardSummary";
import type { DashboardPeriod } from "@/types/dashboard";
import { cn } from "@/utils/cn";

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
  onChange: (period: DashboardPeriod) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Dashboard period"
      className="flex items-center gap-1 rounded-xl border border-border bg-secondary/40 p-1"
    >
      {PERIODS.map((period) => (
        <button
          key={period.value}
          type="button"
          role="radio"
          aria-checked={value === period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            value === period.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
      <div className="mt-5 flex gap-4 border-t border-border/70 pt-3">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return <Skeleton className="h-64 rounded-2xl" />;
}

function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const { data, isLoading } = useDashboardSummary(period);

  const greetingName = (user?.fullName ?? user?.username ?? "Admin").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`${greeting}, ${greetingName}`}
        description="Here's what's happening across your diagnostic centre."
        actions={
          <>
            <PeriodToggle value={period} onChange={setPeriod} />
            <RippleButton asChild>
              <Link to="/admin/patients/register">+ New Patient</Link>
            </RippleButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isLoading || !data ? (
          <>
            <HeroSkeleton />
            <HeroSkeleton />
            <HeroSkeleton />
          </>
        ) : (
          <>
            <HeroStatCard
              title="Total Billing (Walking)"
              value={data.billing.total}
              icon={IndianRupee}
              color="bg-blue-500"
              index={0}
              breakdown={[
                { label: "Collection", value: data.billing.collection, tone: "success" },
                { label: "Due", value: data.billing.due, tone: "danger" },
                { label: "Discount", value: data.billing.discount, tone: "muted" },
              ]}
            />
            <HeroStatCard
              title="Total Reports"
              value={data.reports.total}
              prefix=""
              icon={ClipboardList}
              color="bg-violet-500"
              index={1}
              breakdown={[
                { label: "Generated", value: data.reports.generated, prefix: "", tone: "success" },
                { label: "Submitted", value: data.reports.submitted, prefix: "", tone: "muted" },
                { label: "Pending", value: data.reports.pending, prefix: "", tone: "danger" },
              ]}
            />
            <HeroStatCard
              title="Registration"
              value={data.registration.total}
              prefix=""
              icon={CalendarCheck}
              color="bg-emerald-500"
              index={2}
              breakdown={[
                { label: "Paid", value: data.registration.paid, prefix: "", tone: "success" },
                { label: "Pending", value: data.registration.pending, prefix: "", tone: "danger" },
                {
                  label: "Discounted",
                  value: data.registration.discounted,
                  prefix: "",
                  tone: "muted",
                },
              ]}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.6fr_1fr]">
        {isLoading || !data ? (
          <>
            <PanelSkeleton />
            <PanelSkeleton />
            <PanelSkeleton />
          </>
        ) : (
          <>
            <B2BPanel
              business={data.b2b.business}
              collection={data.b2b.collection}
              due={data.b2b.due}
            />
            <TopReferralsPanel rows={data.topReferrals} total={data.referralBusinessTotal} />
            <PaymentBreakdownPanel
              cash={data.paymentBreakdown.cash}
              online={data.paymentBreakdown.online}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {isLoading || !data ? <PanelSkeleton /> : <TopTestsPanel rows={data.topTests} />}
        </div>
        <QuickActionsWidget />
      </div>

      <SupportRow />
    </div>
  );
}

export { DashboardPage };
