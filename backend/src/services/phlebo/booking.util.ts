import type { AppOrderStatus } from "@prisma/client";

/** doc's lowercase-slug status values, and which slugs a phlebo can legally
 *  transition an order to from its current status. Shared by list, detail,
 *  dashboard and the status-update endpoint so all four can never disagree
 *  about what state a booking is in.
 *
 *  A real (non-draft) `AppOrder` always starts life at `CONFIRMED` (set by
 *  `confirmOrder` in the Patient App) — `PENDING` only ever describes an
 *  abandoned Review-Cart draft (`isDraft: true`), which is never assigned a
 *  `phleboId`. So `CONFIRMED`, not `PENDING`, is the phlebo-facing "pending"
 *  slug — the state an order is in the moment it's assigned and awaiting
 *  the phlebo's accept/reject. `PENDING` is mapped defensively but every
 *  query in this module also filters `isDraft: false` so it should never
 *  actually surface. */
export const STATUS_SLUG: Record<AppOrderStatus, string> = {
  PENDING: "pending",
  CONFIRMED: "pending",
  ACCEPTED: "accepted",
  STARTED_JOURNEY: "started_journey",
  REACHED: "reached",
  SAMPLE_COLLECTED: "sample_collected",
  SAMPLE_DROPPED: "sample_dropped",
  COMPLETED: "completed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const STATUS_LABEL: Record<AppOrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Pending",
  ACCEPTED: "Accepted",
  STARTED_JOURNEY: "Started Journey",
  REACHED: "Reached",
  SAMPLE_COLLECTED: "Sample Collected",
  SAMPLE_DROPPED: "Sample Dropped",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

/** `SAMPLE_DROPPED` (phlebo has dropped the sample off at the lab) is the
 *  phlebo's own last action — `COMPLETED` stays admin/lab-only, set once the
 *  report workflow actually finishes elsewhere, never by the phlebo app. */
const NEXT_ACTIONS: Record<AppOrderStatus, string[]> = {
  PENDING: ["accepted", "rejected"],
  CONFIRMED: ["accepted", "rejected"],
  ACCEPTED: ["started_journey", "rejected"],
  STARTED_JOURNEY: ["reached"],
  REACHED: ["sample_collected"],
  SAMPLE_COLLECTED: ["sample_dropped"],
  SAMPLE_DROPPED: [],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function nextActions(status: AppOrderStatus): string[] {
  return NEXT_ACTIONS[status];
}

const SLUG_TO_STATUS: Record<string, AppOrderStatus> = Object.fromEntries(
  Object.entries(STATUS_SLUG).map(([status, slug]) => [slug, status as AppOrderStatus]),
);

export function statusFromSlug(slug: string): AppOrderStatus | undefined {
  return SLUG_TO_STATUS[slug];
}

/** "14:05" -> "2:05 PM" — the doc's booking detail wants 12-hour clock,
 *  unlike the 24-hour `HH:mm` the rest of the codebase stores/renders slots in. */
function to12Hour(time: string): string {
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export function formatTimeSlot(startTime: string, endTime: string): string {
  return `${to12Hour(startTime)} - ${to12Hour(endTime)}`;
}

export function formatOneLineAddress(address: {
  houseNo: string | null;
  apartment: string | null;
  address: string;
  locality: string | null;
  landmark: string | null;
  city: string;
}): string {
  return [address.houseNo, address.apartment, address.address, address.locality, address.city]
    .filter(Boolean)
    .join(", ");
}

export function toPaymentStatusSlug(status: "PAID" | "PARTIAL" | "PENDING" | null): string {
  return status ? status.toLowerCase() : "pending";
}
