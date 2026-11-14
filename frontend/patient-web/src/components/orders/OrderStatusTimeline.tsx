import { motion } from "framer-motion";
import { Check, XCircle } from "lucide-react";

import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TIMELINE } from "@/types";

import { getOrderStatusKey } from "./orderStatus";

interface OrderStatusTimelineProps {
  status: string;
}

function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const reduceMotion = usePrefersReducedMotion();
  const key = getOrderStatusKey(status);

  if (key === "CANCELLED" || key === "REJECTED") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            {key === "CANCELLED" ? "This booking was cancelled" : "This booking was rejected"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {key === "CANCELLED"
              ? "No further action is needed. If you were charged, refunds (if applicable) will reflect shortly."
              : "This booking could not be processed. Please book again or contact support."}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = key ? ORDER_STATUS_TIMELINE.indexOf(key) : -1;
  const completed = Math.max(currentIndex + 1, 0);
  const percent = Math.round((completed / ORDER_STATUS_TIMELINE.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Collection progress
          </p>
          <p className="mt-0.5 text-sm font-semibold">
            {currentIndex >= 0 ? ORDER_STATUS_LABEL[ORDER_STATUS_TIMELINE[currentIndex]] : status}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary tabular-nums">{percent}%</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Stage {Math.max(completed, 1)} of {ORDER_STATUS_TIMELINE.length}
          </p>
        </div>
      </div>

      <ol className="space-y-0">
        {ORDER_STATUS_TIMELINE.map((stageKey, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === ORDER_STATUS_TIMELINE.length - 1;

          return (
            <li key={stageKey} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: EASE_OUT_EXPO }}
                  className={cn(
                    "relative flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isDone && !isCurrent && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {isCurrent && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      animate={
                        reduceMotion ? undefined : { scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }
                      }
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    />
                  )}
                  {isDone ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        isCurrent ? "bg-current" : "bg-muted-foreground/40",
                      )}
                    />
                  )}
                </motion.div>

                {!isLast && (
                  <div
                    className={cn(
                      "min-h-8 w-0.5 flex-1 rounded-full",
                      isDone
                        ? "bg-primary"
                        : isCurrent
                          ? "bg-gradient-to-b from-primary to-border"
                          : "bg-border",
                    )}
                  />
                )}
              </div>

              <div className={cn("pb-7", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-sm leading-tight font-semibold transition-colors",
                    isCurrent && "text-primary",
                    !isDone && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {ORDER_STATUS_LABEL[stageKey]}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isDone ? "Completed" : isCurrent ? "In progress" : "Pending"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export { OrderStatusTimeline };
