import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { CartItemCard } from "@/components/cart/CartItemCard";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { CartSummaryBar } from "@/components/cart/CartSummaryBar";
import { CouponField } from "@/components/cart/CouponField";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { OrderSummaryCard } from "@/components/cart/OrderSummaryCard";
import { useCart } from "@/hooks/queries/useCart";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function CartPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useCart();
  const cartItems = data?.cartItems ?? [];
  const isEmpty = !isLoading && cartItems.length === 0;

  // Unchanged destination — shared so the desktop (in-summary) and mobile
  // (floating bar) CTAs can never drift apart.
  const proceedToCheckout = () => navigate("/addresses?select=1");

  return (
    // Bottom padding clears the floating CartSummaryBar; at `lg` the CTA moves
    // into the summary card and the bar is hidden, so the gap isn't needed.
    <div className="min-h-screen pb-32 lg:pb-10">
      <PageHeader title="My Cart" />

      <div className="mx-auto max-w-7xl px-4 py-4">
        {isLoading ? (
          <CartSkeleton />
        ) : isEmpty ? (
          <EmptyCart onBrowse={() => navigate("/tests")} />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="mb-4 flex items-center gap-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-md">
                <ShoppingBag className="size-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Review your booking
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"} selected · verify
                  before checkout
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-bold tabular-nums text-foreground shadow-sm">
                {cartItems.length}
              </span>
            </motion.div>

            {/* Items + coupon on the left, sticky summary on the right at lg+;
                stacks to a single column below that. */}
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {cartItems.map((item, i) => (
                    <CartItemCard key={item.id} item={item} index={i} />
                  ))}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: EASE_OUT_EXPO,
                    delay: Math.min(cartItems.length, 8) * 0.04 + 0.05,
                  }}
                  className="pt-2"
                >
                  <CouponField couponApplied={data?.couponApplied ?? null} />
                </motion.div>
              </div>

              {data && (
                <OrderSummaryCard summary={data.paymentSummary} onProceed={proceedToCheckout} />
              )}
            </div>
          </>
        )}
      </div>

      {!isLoading && data && cartItems.length > 0 && (
        <CartSummaryBar
          itemCount={data.paymentSummary.itemCount}
          totalPayable={data.paymentSummary.totalPayable}
          onProceed={proceedToCheckout}
        />
      )}
    </div>
  );
}
