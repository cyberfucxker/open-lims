import { FlaskConical } from "lucide-react";

import { DonutChart } from "@/components/dashboard/DonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTestRow } from "@/types/dashboard";

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

interface TopTestsPanelProps {
  rows: DashboardTestRow[];
}

function TopTestsPanel({ rows }: TopTestsPanelProps) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const half = Math.ceil(rows.length / 2);
  const columns = [rows.slice(0, half), rows.slice(half)];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FlaskConical className="size-4 text-primary" />
          Top Tests
        </CardTitle>
        <span className="text-xs text-muted-foreground">Ordered by count</span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="mx-auto w-full max-w-[170px] shrink-0 sm:mx-0">
          <DonutChart
            data={rows.map((r, i) => ({
              label: r.name,
              value: r.count,
              color: SLICE_COLORS[i % SLICE_COLORS.length],
            }))}
            centerValue={total.toString()}
            centerLabel="Orders"
            height={160}
            innerRadius={48}
            outerRadius={72}
          />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {columns.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1.5">
              {col.map((row, i) => {
                const rank = colIndex * half + i;
                return (
                  <div key={row.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: SLICE_COLORS[rank % SLICE_COLORS.length] }}
                    >
                      {rank + 1}
                    </span>
                    <span className="truncate text-muted-foreground">{row.name}</span>
                    <span className="ml-auto shrink-0 font-semibold text-foreground">
                      {row.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          {rows.length === 0 && (
            <p className="col-span-2 py-6 text-center text-xs text-muted-foreground">
              No tests ordered yet for this period.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { TopTestsPanel };
