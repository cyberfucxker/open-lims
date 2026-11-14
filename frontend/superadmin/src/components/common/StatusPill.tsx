import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

type Tone = NonNullable<BadgeProps["variant"]>;

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "info" },
  phlebo_assigned: { label: "Phlebo Assigned", tone: "info" },
  accepted: { label: "Accepted", tone: "info" },
  started_journey: { label: "Started Journey", tone: "info" },
  reached: { label: "Reached", tone: "secondary" },
  rejected: { label: "Rejected", tone: "destructive" },
  sample_collected: { label: "Sample Collected", tone: "secondary" },
  sample_dropped: { label: "Sample Dropped", tone: "secondary" },
  processing: { label: "Processing", tone: "secondary" },
  report_ready: { label: "Report Ready", tone: "success" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "destructive" },

  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "destructive" },
  refunded: { label: "Refunded", tone: "secondary" },
  partial: { label: "Partial", tone: "warning" },

  active: { label: "Active", tone: "success" },
  on_leave: { label: "On Leave", tone: "warning" },
  inactive: { label: "Inactive", tone: "secondary" },

  approved: { label: "Approved", tone: "success" },
  submitted: { label: "Submitted", tone: "warning" },

  open: { label: "Open", tone: "warning" },
  in_progress: { label: "In Progress", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "success" },

  published: { label: "Published", tone: "success" },
  draft: { label: "Draft", tone: "secondary" },

  not_uploaded: { label: "Not Uploaded", tone: "destructive" },
  uploaded: { label: "Uploaded", tone: "warning" },
  downloaded: { label: "Downloaded", tone: "success" },

  available: { label: "Available", tone: "success" },
  full: { label: "Full", tone: "destructive" },
  blocked: { label: "Blocked", tone: "secondary" },

  low: { label: "Low", tone: "secondary" },
  medium: { label: "Medium", tone: "warning" },
  high: { label: "High", tone: "destructive" },

  android: { label: "Android", tone: "success" },
  ios: { label: "iOS", tone: "info" },
  web: { label: "Web", tone: "secondary" },

  online: { label: "Online", tone: "info" },
  cod: { label: "COD", tone: "warning" },
  wallet: { label: "Wallet", tone: "secondary" },
};

interface StatusPillProps {
  status: string;
  className?: string;
}

function StatusPill({ status, className }: StatusPillProps) {
  const entry = STATUS_MAP[status] ?? { label: status, tone: "outline" as Tone };
  return (
    <Badge variant={entry.tone} className={cn("capitalize", className)}>
      {entry.label}
    </Badge>
  );
}

export { StatusPill };
