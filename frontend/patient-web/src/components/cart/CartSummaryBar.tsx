import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import { ProceedButton } from "@/components/cart/ProceedButton";
import { formatRupees } from "@/utils/format";

interface CartSummaryBarProps {
  itemCount: number;
  totalPayable: number;
  onProceed: () => void;
  disabled?: boolean;
  /** Shows the CTA's loading state while checkout is being prepared. */
  loading?: boolean;
  label?: string;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Mobile/tablet checkout bar — same props and behaviour as before, restyled
 *  as a glass panel. Hidden at `lg` and up, where the CTA lives inside the
 *  sticky `OrderSummaryCard` instead (so it can't overlap page content). */
function CartSummaryBar({
  itemCount,
  totalPayable,
  onProceed,
  disabled = false,
  loading = false,
  label,
}: CartSummaryBarProps) {
  return (
    <motion.div
      initial={{ y: 88, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="fixed inset-x-0 bottom-[calc(var(--bottom-tab-bar-height)+var(--safe-area-bottom))] z-30 px-4 pb-3 md:bottom-4 lg:hidden"
    >
      <div className="glass-panel mx-auto flex max-w-2xl items-center gap-4 rounded-2xl px-4 py-3 shadow-2xl shadow-black/10">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Lock className="size-3" />
            {itemCount} {itemCount === 1 ? "item" : "items"} · secure
          </p>
          <motion.p
            key={totalPayable}
            initial={{ scale: 1.08, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 380 }}
            className="origin-left text-lg font-extrabold tabular-nums text-foreground"
          >
            {formatRupees(totalPayable)}
          </motion.p>
        </div>

        <ProceedButton
          onProceed={onProceed}
          disabled={disabled}
          loading={loading}
          label={label}
          className="ml-auto flex-1 sm:max-w-56"
        />
      </div>
    </motion.div>
  );
}

export { CartSummaryBar };
