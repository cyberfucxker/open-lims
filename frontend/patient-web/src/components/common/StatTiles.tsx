import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

interface StatTile {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Background + text classes for the corner icon chip. */
  iconClass: string;
}

interface StatTilesProps {
  tiles: StatTile[];
  isLoading?: boolean;
  className?: string;
}

/** Glass stat tiles used inside PageHero across the account pages. Values are always
 *  derived from data the page already fetched — these never trigger a request of their own. */
function StatTiles({ tiles, isLoading = false, className }: StatTilesProps) {
  const gridClass = cn("grid grid-cols-3 gap-2.5 sm:gap-3", className);

  if (isLoading) {
    return (
      <div className={gridClass} aria-hidden>
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm sm:p-4"
          >
            <Skeleton className="h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <dl className={gridClass}>
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: EASE_OUT_EXPO }}
          className="relative flex flex-col-reverse gap-0.5 rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm sm:p-4"
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-3 right-3 flex size-7 items-center justify-center rounded-lg",
              tile.iconClass,
            )}
          >
            <tile.icon className="size-3.5" />
          </span>
          {/* Reversed column keeps the spec-correct dt→dd DOM order while showing the
              number above its label. */}
          <dt className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
            {tile.label}
          </dt>
          <dd className="truncate pr-9 text-xl font-bold tabular-nums sm:text-2xl">{tile.value}</dd>
        </motion.div>
      ))}
    </dl>
  );
}

export { StatTiles };
export type { StatTile };
