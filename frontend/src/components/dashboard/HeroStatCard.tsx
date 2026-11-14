import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { CounterNumber } from "@/components/common/CounterNumber";
import { cn } from "@/utils/cn";

export interface HeroBreakdownItem {
  label: string;
  value: number;
  prefix?: string;
  tone?: "success" | "danger" | "muted";
}

interface HeroStatCardProps {
  title: string;
  value: number;
  prefix?: string;
  icon: LucideIcon;
  color: string;
  breakdown: HeroBreakdownItem[];
  index?: number;
}

const TONE_CLASSES: Record<NonNullable<HeroBreakdownItem["tone"]>, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-red-600 dark:text-red-400",
  muted: "text-muted-foreground",
};

function HeroStatCard({
  title,
  value,
  prefix = "₹",
  icon: Icon,
  color,
  breakdown,
  index = 0,
}: HeroStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10"
    >
      <div
        className={cn(
          "absolute -top-10 -right-10 size-36 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-110",
          color,
        )}
      />
      <div className="relative flex items-start justify-between gap-3 p-5 pb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-[28px] leading-none font-bold tracking-tight text-navy-950">
            <CounterNumber value={value} prefix={prefix} />
          </p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg",
            color,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <div
        className="relative mt-auto grid border-t border-border/70"
        style={{ gridTemplateColumns: `repeat(${breakdown.length}, minmax(0, 1fr))` }}
      >
        {breakdown.map((item, i) => (
          <div
            key={item.label}
            className={cn("flex flex-col gap-0.5 px-4 py-3", i > 0 && "border-l border-border/70")}
          >
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {item.label}
            </span>
            <span
              className={cn(
                "text-sm font-semibold text-foreground",
                item.tone && TONE_CLASSES[item.tone],
              )}
            >
              {item.prefix ?? prefix}
              {item.value.toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export { HeroStatCard };
