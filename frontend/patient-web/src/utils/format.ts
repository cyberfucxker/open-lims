import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

export function formatRupees(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

/** Booking dates arrive as plain `YYYY-MM-DD` strings from the app API. Parsing is
 *  deliberately defensive: an unexpected shape degrades to the raw string rather than
 *  rendering "Invalid Date" at the patient. */
function parseBookingDate(value: string): Date | null {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatBookingDate(value: string): string {
  const date = parseBookingDate(value);
  return date ? format(date, "EEE, d MMM yyyy") : value;
}

/** Human proximity marker for a booking date — "Today" / "Tomorrow" / "In 4 days" /
 *  "3 days ago". Returns null when the date can't be parsed so callers render nothing. */
export function formatBookingDayLabel(value: string, from: Date = new Date()): string | null {
  const date = parseBookingDate(value);
  if (!date) return null;

  const days = differenceInCalendarDays(date, from);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
}

/** Social-proof line for a test/package card — rounds down to the nearest
 *  10 above that threshold so it reads as "20+ booked" rather than a jittery
 *  exact count, and returns null (render nothing) when there's no booking
 *  history yet rather than showing an unconvincing "0 booked". */
export function formatBookedCount(count: number): string | null {
  if (count <= 0) return null;
  if (count < 10) return `${count} booked recently`;
  const rounded = Math.floor(count / 10) * 10;
  return `${rounded}+ people booked this`;
}
