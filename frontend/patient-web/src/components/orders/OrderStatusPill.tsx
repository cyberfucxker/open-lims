import { cn } from "@/utils/cn";

import { ORDER_STATUS_TONE, type OrderStatusTone } from "./orderStatus";

interface OrderStatusPillProps {
  label: string;
  tone: OrderStatusTone;
  /** Live bookings get a pulsing dot; terminal ones stay static. */
  pulse?: boolean;
  className?: string;
}

function OrderStatusPill({ label, tone, pulse = false, className }: OrderStatusPillProps) {
  const toneClass = ORDER_STATUS_TONE[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        toneClass.pill,
        className,
      )}
    >
      <span className="relative flex size-1.5 shrink-0">
        {pulse && (
          <span
            aria-hidden
            className={cn("absolute inset-0 animate-ping rounded-full opacity-75", toneClass.dot)}
          />
        )}
        <span className={cn("relative size-1.5 rounded-full", toneClass.dot)} />
      </span>
      {label}
    </span>
  );
}

export { OrderStatusPill };
