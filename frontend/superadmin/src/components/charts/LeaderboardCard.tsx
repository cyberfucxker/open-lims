import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface LeaderboardItem {
  id: string;
  primary: string;
  secondary?: string;
  value: number;
  valueLabel: string;
  avatar?: ReactNode;
}

interface LeaderboardCardProps {
  title: string;
  items: LeaderboardItem[];
  viewAllPath?: string;
  barColor?: string;
}

function LeaderboardCard({
  title,
  items,
  viewAllPath,
  barColor = "var(--chart-1)",
}: LeaderboardCardProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-1">
        <CardTitle className="text-base">{title}</CardTitle>
        {viewAllPath && (
          <Link
            to={viewAllPath}
            className="flex items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-2">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                i === 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            {item.avatar}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{item.primary}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {item.valueLabel}
                </span>
              </div>
              {item.secondary && (
                <span className="truncate text-xs text-muted-foreground">{item.secondary}</span>
              )}
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(item.value / max) * 100}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { LeaderboardCard };
export type { LeaderboardItem };
