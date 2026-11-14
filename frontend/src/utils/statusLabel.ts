/** Converts a backend UPPER_SNAKE status enum (Sample/Report) into the
 *  Title Case string `StatusBadge`'s `STATUS_VARIANTS` map is keyed by —
 *  e.g. "SAMPLE_COLLECTED" -> "Sample Collected", "CRITICAL_LOW" -> "Critical Low". */
export function titleCaseStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Sample/Report "PENDING" would otherwise collide with Billing's "Pending"
 *  (mapped to destructive/red for payment-due) — that reads as "problem"
 *  when it just means "not yet collected/entered", visually indistinguishable
 *  from a genuinely REJECTED sample. Pass this as `StatusBadge`'s `variant`
 *  property to give Sample/Report statuses their own color without touching the
 *  shared Billing mapping. */
export function sampleReportBadgeVariant(status: string): "warning" | undefined {
  return status === "PENDING" ? "warning" : undefined;
}
