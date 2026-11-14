import { Users2 } from "lucide-react";

import { DonutChart } from "@/components/dashboard/DonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardReferralRow } from "@/types/dashboard";

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "#f472b6",
  "#38bdf8",
  "#fb923c",
  "#a3e635",
];

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

interface TopReferralsPanelProps {
  rows: DashboardReferralRow[];
  total: number;
}

function TopReferralsPanel({ rows, total }: TopReferralsPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users2 className="size-4 text-primary" />
          Top Referrals
        </CardTitle>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {formatInr(total)}
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="mx-auto w-full max-w-[180px] shrink-0 sm:mx-0">
          <DonutChart
            data={rows.map((r, i) => ({
              label: r.name,
              value: r.amount,
              color: SLICE_COLORS[i % SLICE_COLORS.length],
            }))}
            centerValue={rows.length.toString()}
            centerLabel="Referrers"
            height={160}
            innerRadius={48}
            outerRadius={72}
            formatValue={formatInr}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto sm:max-h-48">
          {rows.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No referral business yet for this period.
            </p>
          )}
          {rows.map((row, i) => (
            <div key={row.id} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
              />
              <span className="truncate text-muted-foreground">{row.name}</span>
              <span className="ml-auto shrink-0 font-semibold text-foreground">
                {formatInr(row.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { TopReferralsPanel };
