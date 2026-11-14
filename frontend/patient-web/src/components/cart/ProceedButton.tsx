import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

interface ProceedButtonProps {
  onProceed: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
}

/** The checkout CTA — shared by the desktop Order Summary card and the mobile
 *  floating bar so both get the same gradient, sheen sweep and press/hover
 *  micro-interactions from one place. */
function ProceedButton({
  onProceed,
  disabled = false,
  loading = false,
  label = "Proceed",
  className,
}: ProceedButtonProps) {
  const blocked = disabled || loading;

  return (
    <motion.button
      type="button"
      disabled={blocked}
      onClick={onProceed}
      whileHover={blocked ? undefined : { scale: 1.02, y: -1 }}
      whileTap={blocked ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      className={cn(
        "group relative flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-[oklch(0.5_0.22_20)] text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-shadow hover:shadow-xl hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
        className,
      )}
    >
      {/* Decorative sheen sweep — pointer-events-none so it never eats the click. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Processing…
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </motion.button>
  );
}

export { ProceedButton };
