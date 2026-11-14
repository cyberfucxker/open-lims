import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Check, Sun, Sunrise, Sunset } from "lucide-react";

import { cn } from "@/utils/cn";
import type { SlotItem } from "@/types";

interface SlotGridProps {
  slots: SlotItem[];
  selectedSlotId: string | null;
  onSelect: (slot: SlotItem) => void;
}

interface Period {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Start-hour range in 24h, end-exclusive. */
  from: number;
  to: number;
}

const PERIODS: Period[] = [
  { key: "morning", label: "Morning", icon: Sunrise, from: 0, to: 12 },
  { key: "afternoon", label: "Afternoon", icon: Sun, from: 12, to: 17 },
  { key: "evening", label: "Evening", icon: Sunset, from: 17, to: 24 },
];

/** Pulls the start hour (0–23) out of a slot title like "06:00 AM - 08:00 AM".
 *  Returns null if the title doesn't match that shape, so an unexpected format
 *  degrades to one ungrouped list instead of dropping slots. */
function startHourOf(title: string): number | null {
  const match = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(title);
  if (!match) return null;
  const hour12 = Number(match[1]);
  if (hour12 < 1 || hour12 > 12) return null;
  const isPm = match[3].toUpperCase() === "PM";
  if (hour12 === 12) return isPm ? 12 : 0;
  return isPm ? hour12 + 12 : hour12;
}

function SlotChip({
  slot,
  active,
  onSelect,
}: {
  slot: SlotItem;
  active: boolean;
  onSelect: (slot: SlotItem) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(slot)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      className={cn(
        "relative flex w-full flex-col items-center justify-center rounded-xl border px-2.5 py-3 text-center text-sm font-semibold transition-colors",
        active
          ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20 shadow-sm"
          : "border-border/60 bg-card text-foreground shadow-sm hover:border-primary/50 hover:shadow-md",
      )}
    >
      {active && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 420 }}
          className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow"
        >
          <Check className="size-3" strokeWidth={3} />
        </motion.span>
      )}

      <span className="tabular-nums">{slot.title}</span>
    </motion.button>
  );
}

function SlotGrid({ slots, selectedSlotId, onSelect }: SlotGridProps) {
  // Blocked slots are never shown at all — not disabled/struck-through, just
  // omitted — so the picker only ever presents things actually bookable.
  // `SlotSelectPage.tsx`'s own "No slots" empty state (keyed off the open
  // count, not the raw list) covers the day this leaves nothing to show.
  const openSlots = slots.filter((s) => !s.isBlocked);

  // Group by time of day; any slot whose title can't be parsed lands in an
  // "Other" bucket so it still renders.
  const grouped = PERIODS.map((period) => ({
    period,
    items: openSlots.filter((s) => {
      const hour = startHourOf(s.title);
      return hour !== null && hour >= period.from && hour < period.to;
    }),
  })).filter((g) => g.items.length > 0);

  const ungrouped = openSlots.filter((s) => startHourOf(s.title) === null);

  return (
    <div className="space-y-5">
      {grouped.map(({ period, items }, gi) => {
        const Icon = period.icon;
        return (
          <motion.div
            key={period.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: gi * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-3.5" />
              </span>
              <p className="text-sm font-bold text-foreground">{period.label}</p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {items.length} {items.length === 1 ? "slot" : "slots"} available
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {items.map((slot) => (
                <div key={slot.slot_id}>
                  <SlotChip
                    slot={slot}
                    active={slot.slot_id === selectedSlotId}
                    onSelect={onSelect}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {ungrouped.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ungrouped.map((slot) => (
            <div key={slot.slot_id}>
              <SlotChip slot={slot} active={slot.slot_id === selectedSlotId} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { SlotGrid };
