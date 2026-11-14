import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NewVsReturningPoint } from "@/services/api/dashboardSummaryApi";

interface ComparisonTooltipProps {
  active?: boolean;
  payload?: { dataKey: string; name: string; value: number }[];
  label?: string;
}

function ComparisonTooltip({ active, payload, label }: ComparisonTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.name}: <span className="font-medium text-popover-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function NewVsReturningChart({ data: fullData }: { data: NewVsReturningPoint[] }) {
  const data = fullData.filter((_, i) => i % 3 === 0);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">New vs Returning Customers</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--chart-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-axis)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--chart-muted)" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip content={<ComparisonTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Bar
              dataKey="new"
              name="New"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="returning"
              name="Returning"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export { NewVsReturningChart };
