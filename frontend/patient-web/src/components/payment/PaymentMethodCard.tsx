import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { cn } from "@/utils/cn";

interface PaymentMethodCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  /** Optional accepted-instrument chips (e.g. UPI / Cards / Netbanking). */
  badges?: string[];
  /** Optional short reassurance line shown once this method is selected. */
  note?: string;
}

function PaymentMethodCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
  badges,
  note,
}: PaymentMethodCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-sm transition-all",
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-border/60 hover:border-primary/40 hover:shadow-lg",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-[oklch(0.5_0.22_20)] transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      />

      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            selected
              ? "bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-sm"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>

          {badges && badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-border/60 bg-secondary/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-primary bg-primary" : "border-input",
          )}
        >
          {selected && (
            <motion.span
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 420 }}
            >
              <Check className="size-3 text-white" strokeWidth={3} />
            </motion.span>
          )}
        </span>
      </div>

      {note && selected && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 overflow-hidden border-t border-dashed border-border pt-2.5 text-[11px] leading-relaxed text-muted-foreground"
        >
          {note}
        </motion.p>
      )}
    </motion.button>
  );
}

export { PaymentMethodCard };
