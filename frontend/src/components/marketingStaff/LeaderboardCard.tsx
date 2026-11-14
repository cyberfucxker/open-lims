import { useState } from "react";
import { Trophy } from "lucide-react";

import { ChartCard } from "@/components/common/ChartCard";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard } from "@/hooks/queries/useMarketingReport";
import type { LeaderboardEntry, LeaderboardRankBy } from "@/types/marketingReport";
import { cn } from "@/utils/cn";

interface LeaderboardCardProps {
  month: number;
  year: number;
}

const RANK_BY_OPTIONS: { value: LeaderboardRankBy; label: string }[] = [
  { value: "achievementPercent", label: "Achievement %" },
  { value: "revenueAchieved", label: "Revenue Achieved" },
  { value: "commissionAmount", label: "Commission" },
];

function formatInr(value: number) {
  return `₹${Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatMetric(entry: LeaderboardEntry, rankBy: LeaderboardRankBy) {
  if (rankBy === "achievementPercent") {
    return entry.achievementPercent === null ? "—" : `${entry.achievementPercent.toFixed(1)}%`;
  }
  if (rankBy === "revenueAchieved") {
    return formatInr(entry.revenueAchieved);
  }
  return formatInr(entry.commissionAmount);
}

const RANK_BADGE_STYLES = [
  "bg-amber-400 text-white",
  "bg-slate-400 text-white",
  "bg-orange-600 text-white",
];

function LeaderboardCard({ month, year }: LeaderboardCardProps) {
  const [rankBy, setRankBy] = useState<LeaderboardRankBy>("achievementPercent");
  const { data, isLoading } = useLeaderboard(month, year, rankBy);

  const rows = data?.rows ?? [];

  return (
    <ChartCard
      title="Leaderboard"
      description="Top performing marketing staff"
      action={
        <Select value={rankBy} onValueChange={(value) => setRankBy(value as LeaderboardRankBy)}>
          <SelectTrigger className="h-9 w-[168px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANK_BY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No data yet"
          description="No marketing staff activity recorded for this month."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((entry) => (
            <div
              key={entry.marketingStaffId}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent/40"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  entry.rank <= 3
                    ? RANK_BADGE_STYLES[entry.rank - 1]
                    : "bg-muted text-muted-foreground",
                )}
              >
                {entry.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-950">{entry.staffName}</p>
                <p className="truncate text-xs text-muted-foreground">{entry.employeeCode}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {formatMetric(entry, rankBy)}
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

export { LeaderboardCard };
