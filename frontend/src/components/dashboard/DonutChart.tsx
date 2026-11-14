import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/dashboard/ChartTooltip";

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  centerLabel?: string;
  centerValue?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  formatValue?: (value: number) => string;
}

function DonutChart({
  data,
  centerLabel,
  centerValue,
  height = 180,
  innerRadius = 54,
  outerRadius = 80,
  formatValue,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const isEmpty = total <= 0;
  const chartData = isEmpty ? [{ label: "No data", value: 1, color: "var(--muted)" }] : data;

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={isEmpty ? 0 : 3}
            cornerRadius={6}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={!isEmpty}
          >
            {chartData.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          {!isEmpty && (
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map((p) => ({
                    name: String(p.name),
                    value: Number(p.value),
                    color: (p.payload as { fill?: string })?.fill ?? "var(--chart-1)",
                  }))}
                  formatValue={formatValue}
                />
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {centerValue && (
          <span className="text-lg font-bold tracking-tight text-navy-950">
            {isEmpty ? "—" : centerValue}
          </span>
        )}
        {centerLabel && <span className="text-[11px] text-muted-foreground">{centerLabel}</span>}
      </div>
    </div>
  );
}

export { DonutChart };
