import { Badge, type BadgeProps } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  Registered: "info",
  "Sample Collected": "warning",
  Processing: "warning",
  Completed: "success",
  Authorized: "gradient",
  Active: "success",
  Inactive: "secondary",
  Paid: "success",
  Partial: "warning",
  Pending: "destructive",
  Due: "warning",
  Free: "info",
  Cancelled: "secondary",
  Deleted: "secondary",
  // Sample Collection module
  Collected: "info",
  Received: "success",
  Rejected: "destructive",
  // Report Generation module
  Submitted: "info",
  Approved: "gradient",
  Printed: "success",
  STAT: "destructive",
  // Sample/Report masters ("Sample Rules", "Barcode Settings")
  Configured: "success",
  "Not Configured": "outline",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  /** Overrides the `STATUS_VARIANTS` lookup for this render only — for the
   *  rare case where the same status word (e.g. "Pending") needs a different
   *  color in a different module without changing every other usage. */
  variant?: BadgeProps["variant"];
}

function StatusBadge({ status, className, variant }: StatusBadgeProps) {
  return (
    <Badge variant={variant ?? STATUS_VARIANTS[status] ?? "outline"} className={className}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

export { StatusBadge };
