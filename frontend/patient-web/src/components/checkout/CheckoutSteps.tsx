import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { cn } from "@/utils/cn";

/** The booking funnel, in route order:
 *  /cart → /addresses?select=1 → /slots → /payment
 *  (no separate Review step — Slot's own "Continue" already prepares the
 *  order and lands straight on Payment). */
const STEPS = [
  { key: "cart", label: "Cart" },
  { key: "address", label: "Address" },
  { key: "slot", label: "Slot" },
  { key: "payment", label: "Payment" },
] as const;

type CheckoutStepKey = (typeof STEPS)[number]["key"];

interface CheckoutStepsProps {
  current: CheckoutStepKey;
  className?: string;
}

/** Progress indicator for the checkout funnel. Purely informational — it
 *  renders no links, so it can't let someone skip a step the flow's own
 *  guards would otherwise block. Reusable across the other funnel pages. */
function CheckoutSteps({ current, className }: CheckoutStepsProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className={className}>
      {/* Mobile: a compact bar — five labelled nodes don't fit narrow screens. */}
      <div className="sm:hidden">
        <div className="mb-1.5 flex items-baseline justify-between">
          <p className="text-xs font-semibold text-foreground">{STEPS[currentIndex]?.label}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Step {currentIndex + 1} of {STEPS.length}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.5_0.22_20)]"
          />
        </div>
      </div>

      {/* Desktop: full node/connector stepper. */}
      <ol className="hidden items-center sm:flex">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li
              key={step.key}
              className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  initial={false}
                  animate={{ scale: active ? 1 : 0.92 }}
                  transition={{ type: "spring", damping: 18, stiffness: 380 }}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                    done && "bg-primary text-white",
                    active &&
                      "bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-md",
                    !done && !active && "border border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </motion.span>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <span aria-hidden className="mx-2 h-px flex-1 overflow-hidden bg-border">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: i < currentIndex ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.06 }}
                    className="block h-px origin-left bg-primary"
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export { CheckoutSteps };
export type { CheckoutStepKey };
