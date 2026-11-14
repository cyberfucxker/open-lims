import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import type { ReferralType } from "@/types/referralSource";
import type { ReferralTypeDistribution } from "@/types/referralReport";

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const REFERRAL_TYPE_LABELS: Record<ReferralType, string> = {
  DOCTOR: "Doctor",
  HOSPITAL: "Hospital",
  CLINIC: "Clinic",
  SELF: "Self",
  CORPORATE: "Corporate",
  OTHER: "Other",
};

interface ReferralTypeDistributionChartProps {
  data: ReferralTypeDistribution[];
}

function ReferralTypeDistributionChart({ data }: ReferralTypeDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="referralType"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              cornerRadius={4}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.referralType} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map((p) => ({
                    name: REFERRAL_TYPE_LABELS[p.name as ReferralType] ?? String(p.name),
                    value: Number(p.value),
                    color: (p.payload as { fill?: string })?.fill ?? "var(--chart-1)",
                  }))}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-navy-950">{total}</span>
          <span className="text-xs text-muted-foreground">Total Sources</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
        {data.map((entry, i) => (
          <div key={entry.referralType} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
            />
            <span className="truncate text-muted-foreground">
              {REFERRAL_TYPE_LABELS[entry.referralType] ?? entry.referralType}
            </span>
            <span className="ml-auto font-medium text-foreground">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ReferralTypeDistributionChart };
