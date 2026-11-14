import { cn } from "@/utils/cn";

interface OrderProgressTrackProps {
  /** 1-based stage the booking currently sits on. */
  step: number;
  totalSteps: number;
  /** Tone fill class from ORDER_STATUS_TONE. */
  fillClass: string;
  className?: string;
}

/** Segmented read-out of where a live booking sits on the collection track. Mirrors
 *  ORDER_STATUS_TIMELINE (7 stages) so the list card and the detail-page timeline can
 *  never disagree about progress. */
function OrderProgressTrack({ step, totalSteps, fillClass, className }: OrderProgressTrackProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <span>Collection progress</span>
        <span className="tabular-nums normal-case">
          Stage {step} of {totalSteps}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Collection progress"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={step}
        className="flex gap-1"
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < step ? fillClass : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export { OrderProgressTrack };
