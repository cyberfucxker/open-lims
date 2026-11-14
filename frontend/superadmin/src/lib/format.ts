export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(iso);
}

export function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** "14:00" → "2:00 PM". Slot times are stored and transported as 24-hour
 *  `HH:mm` strings (`Slot.startTime`/`endTime`, `VarChar(5)`) because that
 *  sorts and compares correctly; ops staff read the clock the way patients
 *  quote it back to them on the phone, so every screen that SHOWS a slot
 *  runs it through here first.
 *
 *  Anything that isn't a parseable `H:mm`/`HH:mm` is returned untouched
 *  rather than mangled into "NaN:NaN AM" — the field is a plain string on
 *  the wire, so a legacy or free-text value ("Morning", "") must survive
 *  being displayed. */
export function formatTime12h(time: string | null | undefined): string {
  if (!time) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return time;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return time;

  const suffix = hours < 12 ? "AM" : "PM";
  // 0 → 12 AM (midnight), 12 → 12 PM (noon), 13 → 1 PM.
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/** Both ends of a slot in one go: "08:00 - 10:00" → "8:00 AM - 10:00 AM".
 *  Accepts either the pre-joined `slotLabel` the orders list carries or a
 *  separate start/end pair. A label that doesn't split into two times is
 *  passed through as-is (see `formatTime12h` on why). */
export function formatTimeRange12h(start: string | null | undefined, end?: string | null): string {
  if (end != null) {
    return `${formatTime12h(start)} - ${formatTime12h(end)}`;
  }
  if (!start) return "";
  const parts = start.split(" - ");
  if (parts.length !== 2) return start;
  return `${formatTime12h(parts[0])} - ${formatTime12h(parts[1])}`;
}

/** A booking day ("YYYY-MM-DD", or an ISO timestamp whose date part is the
 *  booking day) as ops read it: "Fri, 23 Oct 2026". Parsed from its parts —
 *  `new Date("2026-10-23")` is UTC midnight, which can render as the previous
 *  day west of UTC. */
export function formatBookingDate(value: string | null | undefined): string {
  const day = parseBookingDay(value);
  if (!day) return "—";
  return day.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "Today" / "Tomorrow" / "Yesterday" relative to the viewer's local date,
 *  or null for any other day. */
export function bookingDayTag(value: string | null | undefined): string | null {
  const day = parseBookingDay(value);
  if (!day) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  return diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday" : null;
}

function parseBookingDay(value: string | null | undefined): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
