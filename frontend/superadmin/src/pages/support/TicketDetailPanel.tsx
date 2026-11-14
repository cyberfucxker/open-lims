import { ImageOff } from "lucide-react";

import { SidePanel } from "@/components/common/SidePanel";
import { StatusPill } from "@/components/common/StatusPill";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { resolveUploadUrl } from "@/services/api/httpClient";
import type { SupportTicket, SupportTicketStatus } from "@/services/api/supportTicketApi";

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CLOSED", label: "Closed" },
];

interface TicketDetailPanelProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: SupportTicketStatus) => void;
}

function TicketDetailPanel({ ticket, open, onOpenChange, onStatusChange }: TicketDetailPanelProps) {
  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={ticket ? ticket.ticketNumber : "Ticket details"}
      description={ticket ? `Raised by ${ticket.customerName}` : undefined}
      widthClassName="sm:max-w-lg"
    >
      {ticket && (
        <div className="flex flex-col gap-6">
          <StatusPill status={ticket.status.toLowerCase()} />

          <section className="rounded-xl border border-border bg-secondary/30 p-4">
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Subject
            </h3>
            <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
          </section>

          <section className="rounded-xl border border-border bg-secondary/30 p-4">
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap text-foreground">{ticket.description}</p>
          </section>

          <section className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Customer</div>
              <div className="mt-1 font-medium text-foreground">{ticket.customerName}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Mobile</div>
              <div className="mt-1 font-medium text-foreground">{ticket.customerMobile}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="mt-1 font-medium text-foreground">
                {formatDateTime(ticket.createdAt)}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Last Update</div>
              <div className="mt-1 font-medium text-foreground">
                {formatDateTime(ticket.updatedAt)}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Screenshot
            </Label>
            {ticket.screenshotUrl ? (
              <a
                href={resolveUploadUrl(ticket.screenshotUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={resolveUploadUrl(ticket.screenshotUrl)}
                  alt="Ticket screenshot"
                  className="max-h-64 w-full rounded-lg border border-border object-contain"
                />
              </a>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <ImageOff className="size-4" />
                No screenshot attached
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Change Status
            </Label>
            <Select
              value={ticket.status}
              onValueChange={(v) => onStatusChange(ticket.id, v as SupportTicketStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>
      )}
    </SidePanel>
  );
}

export { TicketDetailPanel };
