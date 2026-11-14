import { motion } from "framer-motion";
import { PiggyBank, ReceiptText, ShieldCheck } from "lucide-react";

import { ProceedButton } from "@/components/cart/ProceedButton";
import { formatRupees } from "@/utils/format";
import type { CartPaymentSummary } from "@/types";

interface OrderSummaryCardProps {
  summary: CartPaymentSummary;
  /** Omit to render the panel read-only — later checkout steps (address, slot)
   *  show the same figures but drive the flow from their own CTA. */
  onProceed?: () => void;
  /** Only meaningful alongside `onProceed`. */
  label?: string;
  disabled?: boolean;
  loading?: boolean;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Sticky "Order Summary" panel — the Bill-details block redesigned. Reads
 *  every figure straight off the existing `paymentSummary` payload; no line is
 *  computed or invented beyond `totalSavings`, which is just the MRP, coupon
 *  and wallet discounts the API already returns added together.
 *
 *  There is deliberately no "Taxes" row: the cart API exposes no tax field
 *  (subtotal − discounts === totalPayable), so rendering one would be
 *  fabricating a number. If tax ever lands in `paymentSummary`, add it between
 *  Discount and Total. */
function OrderSummaryCard({
  summary,
  onProceed,
  label = "Proceed to Checkout",
  disabled = false,
  loading = false,
}: OrderSummaryCardProps) {
  const totalSavings = summary.mrpDiscount + summary.couponDiscount + summary.walletDiscount;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.08 }}
      className="lg:sticky lg:top-20"
    >
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
        {/* Navy header keeps the summary visually distinct from the item cards
            without pulling the brand-red CTA colour into a passive surface. */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] px-5 py-4">
          <div
            aria-hidden
            className="absolute -top-10 -right-8 size-32 rounded-full bg-white/20 blur-2xl"
          />
          <div className="relative flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
              <ReceiptText className="size-4.5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Order Summary</h2>
              <p className="text-xs text-white/60">
                {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"} in this booking
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 px-5 py-4 text-sm">
          {summary.mrpDiscount > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total MRP</span>
                <span className="font-medium tabular-nums text-muted-foreground line-through decoration-muted-foreground/50">
                  {formatRupees(summary.totalMrp)}
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount on MRP</span>
                <span className="font-medium tabular-nums">
                  −{formatRupees(summary.mrpDiscount)}
                </span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatRupees(summary.subtotal)}
            </span>
          </div>

          {summary.couponDiscount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span>Coupon discount</span>
              <span className="font-medium tabular-nums">
                −{formatRupees(summary.couponDiscount)}
              </span>
            </div>
          )}

          {summary.walletDiscount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span>Wallet discount</span>
              <span className="font-medium tabular-nums">
                −{formatRupees(summary.walletDiscount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
            <span className="text-base font-bold text-foreground">Total Payable</span>
            <motion.span
              key={summary.totalPayable}
              initial={{ scale: 1.1, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 380 }}
              className="text-xl font-extrabold tabular-nums text-foreground"
            >
              {formatRupees(summary.totalPayable)}
            </motion.span>
          </div>

          {totalSavings > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5"
            >
              <PiggyBank className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Total savings {formatRupees(totalSavings)} on this order
              </p>
            </motion.div>
          )}

          {/* Desktop CTA. Below `lg` the floating `CartSummaryBar` carries it
              instead, so the two never show at once. */}
          {onProceed && (
            <ProceedButton
              onProceed={onProceed}
              label={label}
              disabled={disabled}
              loading={loading}
              className="mt-1 hidden w-full lg:flex"
            />
          )}

          {/* No longer promises "free" collection: a city on the new slot
              system charges `City.phlebotomyCharge` (₹100 by default) and an
              Area can override it, so this panel had the app guaranteeing
              something it then billed for. The amount itself needs the
              address's area and the slot, which is why it can only appear
              from the payment step — see `PaymentPage`'s breakdown. */}
          <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-px size-3.5 shrink-0 text-primary" />
            Accredited labs · home sample collection · secure payment
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

export { OrderSummaryCard };
