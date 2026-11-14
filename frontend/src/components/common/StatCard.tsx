import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { CounterNumber } from "@/components/common/CounterNumber";
import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: number;
  trend?: number;
  icon: LucideIcon;
  color?: string;
  prefix?: string;
  suffix?: string;
  index?: number;
}

const DEFAULT_COLOR = "bg-primary";

function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  color = DEFAULT_COLOR,
  prefix,
  suffix,
  index = 0,
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10"
    >
      <div
        className={cn(
          "absolute -top-8 -right-8 size-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-25 group-hover:scale-110",
          color,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl text-white shadow-lg",
            color,
          )}
        >
          <Icon className="size-5" />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400",
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="relative mt-4 text-2xl font-bold tracking-tight text-navy-950">
        <CounterNumber value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="relative mt-1 text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export { StatCard };
