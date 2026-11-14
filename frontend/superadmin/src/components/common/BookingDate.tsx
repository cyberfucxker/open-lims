import { bookingDayTag, formatBookingDate } from "@/lib/format";
import { cn } from "@/utils/cn";

/** The day a home-collection visit is booked for, with a Today/Tomorrow chip
 *  so ops can tell at a glance which visits are due. */
function BookingDate({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const tag = bookingDayTag(value);
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span>{formatBookingDate(value)}</span>
      {tag && (
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-[10px] font-semibold",
            tag === "Today" && "bg-primary/10 text-primary",
            tag === "Tomorrow" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
            tag === "Yesterday" && "bg-muted text-muted-foreground",
          )}
        >
          {tag}
        </span>
      )}
    </span>
  );
}

export { BookingDate };
