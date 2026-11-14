import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency } from "@/lib/format";

interface TrendAreaChartCardProps {
  title: string;
  data: { date: string; revenue: number }[];
  action?: React.ReactNode;
}

interface RevenueTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function RevenueTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function TrendAreaChartCard({ title, data, action }: TrendAreaChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--chart-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-axis)" }}
              interval={Math.ceil(data.length / 8)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--chart-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactNumber(v)}
              width={44}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export { TrendAreaChartCard };
