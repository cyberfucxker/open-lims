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
import { useReferralRanking } from "@/hooks/queries/useReferralReport";
import type { ReferralRankBy, ReferralRankingRow } from "@/types/referralReport";
import { cn } from "@/utils/cn";

const RANK_BY_OPTIONS: { value: ReferralRankBy; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "patients", label: "Patients" },
  { value: "commission", label: "Commission" },
];

const REFERRAL_TYPE_LABELS: Record<string, string> = {
  DOCTOR: "Doctor",
  HOSPITAL: "Hospital",
  CLINIC: "Clinic",
  SELF: "Self",
  CORPORATE: "Corporate",
  OTHER: "Other",
};

function formatInr(value: number) {
  return `₹${Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatMetric(entry: ReferralRankingRow, rankBy: ReferralRankBy) {
  if (rankBy === "patients") {
    return Intl.NumberFormat("en-IN").format(entry.patients);
  }
  if (rankBy === "commission") {
    return formatInr(entry.commission);
  }
  return formatInr(entry.revenue);
}

const RANK_BADGE_STYLES = [
  "bg-amber-400 text-white",
  "bg-slate-400 text-white",
  "bg-orange-600 text-white",
];

function ReferralLeaderboardCard() {
  const [rankBy, setRankBy] = useState<ReferralRankBy>("revenue");
  const { data, isLoading } = useReferralRanking(rankBy);

  const rows = data ?? [];

  return (
    <ChartCard
      title="Top Referrals"
      description="Ranked referral sources"
      action={
        <Select value={rankBy} onValueChange={(value) => setRankBy(value as ReferralRankBy)}>
          <SelectTrigger className="h-9 w-[140px] text-xs">
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
          description="No referral activity recorded yet."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((entry) => (
            <div
              key={entry.referralSourceId}
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
                <p className="truncate text-sm font-semibold text-navy-950">
                  {entry.referralSourceName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {REFERRAL_TYPE_LABELS[entry.referralType] ?? entry.referralType}
                </p>
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

export { ReferralLeaderboardCard };
