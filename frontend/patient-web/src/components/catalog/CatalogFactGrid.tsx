import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";

export interface CatalogFact {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}

const TONE_CLASSES: Record<NonNullable<CatalogFact["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/** Icon-tile "fact" row for a Test/Package detail — report time, fasting,
 *  sample type, recommended-for/age, parameter count, etc. Each tile is a
 *  real (SVG) lucide icon in a tinted badge, not a plain text label, so the
 *  prep information reads at a glance instead of as a wall of text. */
function CatalogFactGrid({ facts }: { facts: CatalogFact[] }) {
  if (facts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              TONE_CLASSES[fact.tone ?? "default"],
            )}
          >
            <fact.icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">{fact.label}</p>
            <p className="truncate text-sm font-bold text-foreground">{fact.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { CatalogFactGrid };
