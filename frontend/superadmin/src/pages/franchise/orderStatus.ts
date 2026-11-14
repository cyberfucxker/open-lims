import type { BadgeProps } from "@/components/ui/badge";

/** Shared status presentation for the franchise Orders list and the dashboard's
 *  Recent Orders strip, so one order never reads differently in two places.
 *  Keyed loosely by string because the API returns the raw `AppOrderStatus`. */
export const ORDER_STATUS_BADGE: Record<
  string,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  ACCEPTED: { label: "Accepted", variant: "info" },
  STARTED_JOURNEY: { label: "On the way", variant: "info" },
  REACHED: { label: "Reached", variant: "info" },
  SAMPLE_COLLECTED: { label: "Sample collected", variant: "info" },
  SAMPLE_DROPPED: { label: "At lab", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export const ORDER_STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SAMPLE_COLLECTED", label: "Sample collected" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];
