import { Wallet } from "lucide-react";

import { DonutChart } from "@/components/dashboard/DonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentBreakdownPanelProps {
  cash: number;
  online: number;
}

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function PaymentBreakdownPanel({ cash, online }: PaymentBreakdownPanelProps) {
  const total = cash + online;
  const data = [
    { label: "Cash", value: cash, color: "var(--chart-2)" },
    { label: "Online", value: online, color: "var(--chart-1)" },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wallet className="size-4 text-primary" />
          Payment Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="w-full max-w-[170px]">
          <DonutChart
            data={data}
            centerValue={formatInr(total)}
            centerLabel="Total"
            height={170}
            innerRadius={50}
            outerRadius={76}
            formatValue={formatInr}
          />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          {data.map((entry) => (
            <div key={entry.label} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.label}</span>
              <span className="ml-auto font-semibold text-foreground">
                {formatInr(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { PaymentBreakdownPanel };
