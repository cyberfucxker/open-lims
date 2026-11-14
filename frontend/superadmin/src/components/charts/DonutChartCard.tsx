import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface DonutChartCardProps {
  title: string;
  data: DonutDatum[];
  centerLabel?: string;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-popover-foreground">{item.name}</p>
      <p className="text-muted-foreground">{formatNumber(item.value)} orders</p>
    </div>
  );
}

function DonutChartCard({ title, data, centerLabel }: DonutChartCardProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 pt-2">
        <div className="relative h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={2}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatNumber(total)}
            </span>
            <span className="text-[11px] text-muted-foreground">{centerLabel ?? "Total"}</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}
              <span className="font-medium text-foreground">
                {total ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { DonutChartCard };
export type { DonutDatum };
