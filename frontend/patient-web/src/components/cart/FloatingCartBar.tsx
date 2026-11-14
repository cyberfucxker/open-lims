import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingCart } from "lucide-react";

import { useCart } from "@/hooks/queries/useCart";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/utils/cn";
import { formatRupees } from "@/utils/format";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface FloatingCartBarProps {
  /** Test/Package detail pages already pin their own "Add to Cart" CTA to
   *  the exact same bottom slot (mobile only — desktop uses a sidebar CTA
   *  instead), so this bar would land right on top of it there. Pass `true`
   *  to stack above that bar instead of overlapping it; omit everywhere else
   *  (Home, Catalog) where nothing else occupies that spot. */
  stackAboveOwnCta?: boolean;
}

/** Glass "View Cart" bar that slides up once at least one test/package is in
 *  the cart. Sits above the mobile bottom tab bar (same
 *  `--bottom-tab-bar-height` offset the detail pages' sticky CTA uses) and
 *  drops to the viewport bottom on desktop, where no tab bar renders.
 *
 *  The count/amount pulse on every add: `lastAddedAt` is bumped by
 *  `useAddToCart`, so the pop plays once per add instead of on every
 *  unrelated re-render (same trick the tab-bar badge uses). */
function FloatingCartBar({ stackAboveOwnCta = false }: FloatingCartBarProps = {}) {
  const navigate = useNavigate();
  const { data } = useCart();
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (lastAddedAt) setPulseKey((k) => k + 1);
  }, [lastAddedAt]);

  const itemCount = data?.cartItems.length ?? 0;
  // Estimated, not final: shipping/phlebotomy charges and coupons are applied
  // at checkout, so this mirrors the cart's own pre-checkout subtotal.
  const amount = data?.paymentSummary.totalPayable ?? 0;
  const visible = itemCount > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className={cn(
            "fixed inset-x-0 z-30 px-4 pb-3",
            stackAboveOwnCta
              ? // Same offset as the page's own CTA bar, plus that bar's own
                // rough height, so the two stack with a clean gap instead of
                // overlapping. That other bar only exists below `lg`, so this
                // reverts to the plain desktop position from `lg` up.
                "bottom-[calc(var(--bottom-tab-bar-height)+var(--safe-area-bottom)+5rem)] lg:bottom-4"
              : "bottom-[calc(var(--bottom-tab-bar-height)+var(--safe-area-bottom))] md:bottom-4",
          )}
        >
          <motion.button
            type="button"
            onClick={() => navigate("/cart")}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className="glass-panel mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/10 transition-colors hover:border-primary/30"
          >
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white shadow-md shadow-brand-navy/25">
              <ShoppingCart className="size-5" />
              <motion.span
                key={pulseKey}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 420 }}
                className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-bold tabular-nums text-background"
              >
                {itemCount}
              </motion.span>
            </span>

            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold text-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"} selected
              </span>
              <motion.span
                key={`amount-${pulseKey}`}
                initial={{ scale: 1.12 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 16, stiffness: 400 }}
                className="block origin-left truncate text-xs text-muted-foreground"
              >
                Est. <strong className="text-foreground">{formatRupees(amount)}</strong>
                <span className="hidden sm:inline"> · taxes at checkout</span>
              </motion.span>
            </span>

            <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25">
              View Cart
              <ArrowRight className="size-4" />
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { FloatingCartBar };
