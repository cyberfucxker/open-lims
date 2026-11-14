import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgePercent, Check, Loader2, TicketPercent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplyCoupon, useRemoveCoupon } from "@/hooks/queries/useCart";
import { cn } from "@/utils/cn";
import { formatRupees } from "@/utils/format";
import type { CartCouponApplied } from "@/types";

interface CouponFieldProps {
  couponApplied: CartCouponApplied | null;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

function CouponField({ couponApplied }: CouponFieldProps) {
  const [code, setCode] = useState("");
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition-colors duration-300",
        couponApplied
          ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
          : "border-border/60 bg-card",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {couponApplied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-3"
          >
            <motion.span
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 420 }}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
            >
              <Check className="size-5" strokeWidth={3} />
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md border border-dashed border-emerald-600/50 bg-white px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {couponApplied.couponCode}
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  applied
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
                You saved{" "}
                <strong className="font-bold text-emerald-700 dark:text-emerald-300">
                  {formatRupees(couponApplied.discountAmount)}
                </strong>{" "}
                with this coupon
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remove coupon"
              disabled={removeCoupon.isPending}
              onClick={() => removeCoupon.mutate()}
              className="shrink-0 font-semibold text-emerald-700 hover:bg-emerald-600/10 hover:text-emerald-800 dark:text-emerald-300"
            >
              {removeCoupon.isPending ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="entry"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TicketPercent className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Have a coupon?</p>
                <p className="text-xs text-muted-foreground">
                  Apply a code to save more on this order
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <BadgePercent className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter coupon code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="pl-10 font-mono tracking-wide uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  disabled={!code.trim() || applyCoupon.isPending}
                  onClick={() =>
                    applyCoupon.mutate(code.trim(), {
                      onSuccess: (result) => {
                        if (result.status) setCode("");
                      },
                    })
                  }
                  className="min-w-24 bg-gradient-to-r from-primary to-[oklch(0.5_0.22_20)] text-white shadow-sm transition-shadow hover:shadow-md hover:shadow-primary/25 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                  {applyCoupon.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Applying
                    </>
                  ) : (
                    "Apply"
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { CouponField };
