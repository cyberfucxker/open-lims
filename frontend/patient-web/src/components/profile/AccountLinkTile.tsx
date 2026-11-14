import { motion } from "framer-motion";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

interface AccountLinkTileProps {
  to: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  iconClass: string;
  index?: number;
}

function AccountLinkTile({
  to,
  label,
  caption,
  icon: Icon,
  iconClass,
  index = 0,
}: AccountLinkTileProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index, 6) * 0.04, ease: EASE_OUT_EXPO }}
    >
      <Link
        to={to}
        className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-black/[0.06] focus-visible:ring-4 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-foreground/[0.03] blur-2xl transition-opacity duration-300 group-hover:bg-foreground/[0.05]"
        />
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-current/15 transition-transform duration-300 group-hover:scale-105",
            iconClass,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{caption}</p>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary/10 group-hover:text-primary">
          <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}

export { AccountLinkTile };
