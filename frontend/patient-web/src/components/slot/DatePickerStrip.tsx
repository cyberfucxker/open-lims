import { motion } from "framer-motion";
import { addDays, format, isSameDay, isToday, isTomorrow } from "date-fns";

import { cn } from "@/utils/cn";

interface DatePickerStripProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  days?: number;
}

/** Short label above the date — "Today"/"Tomorrow" read faster than a weekday
 *  for the two dates people pick most. */
function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tmrw";
  return format(date, "EEE");
}

function DatePickerStrip({ selectedDate, onSelect, days = 14 }: DatePickerStripProps) {
  const dates = Array.from({ length: days }, (_, i) => addDays(new Date(), i));

  return (
    <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 py-2">
      {dates.map((date) => {
        const active = isSameDay(date, selectedDate);
        return (
          <motion.button
            key={date.toISOString()}
            type="button"
            onClick={() => onSelect(date)}
            whileHover={active ? undefined : { y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", damping: 20, stiffness: 400 }}
            className={cn(
              "relative flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-2 py-2.5 text-center transition-colors",
              active
                ? "border-transparent bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-md"
                : "border-border/60 bg-card text-foreground shadow-sm hover:border-primary/50",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold tracking-wide uppercase",
                active ? "text-white/75" : "text-muted-foreground",
              )}
            >
              {dayLabel(date)}
            </span>
            <span className="text-base leading-none font-bold tabular-nums">
              {format(date, "d")}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium",
                active ? "text-white/75" : "text-muted-foreground",
              )}
            >
              {format(date, "MMM")}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export { DatePickerStrip };
