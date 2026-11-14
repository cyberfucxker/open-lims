import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";

interface StatCardBreakdown {
  label: string;
  value: string;
  tone?: "success" | "danger" | "muted";
}

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient?: string;
  index?: number;
  breakdown?: StatCardBreakdown[];
  onClick?: () => void;
  alert?: boolean;
}

const TONE_CLASSES: Record<NonNullable<StatCardBreakdown["tone"]>, string> = {
  success: "text-success",
  danger: "text-destructive",
  muted: "text-muted-foreground",
};

function StatCard({
  title,
  value,
  icon: Icon,
  gradient = "bg-primary",
  index = 0,
  breakdown,
  onClick,
  alert = false,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
        alert ? "border-destructive/30 bg-destructive/[0.03]" : "border-border",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="text-[28px] leading-none font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
            gradient,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="mt-5 flex gap-4 border-t border-border/70 pt-3">
          {breakdown.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">{b.label}</span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  b.tone ? TONE_CLASSES[b.tone] : "text-foreground",
                )}
              >
                {b.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export { StatCard };
export type { StatCardProps, StatCardBreakdown };
