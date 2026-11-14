import type { LucideIcon } from "lucide-react";

import type { SupportTicket, SupportTicketStatus } from "@/services/api/supportTicketApi";
import { cn } from "@/utils/cn";

import { TicketCard } from "./TicketCard";

interface TicketColumnProps {
  title: string;
  icon: LucideIcon;
  accentClass: string;
  tickets: SupportTicket[];
  onOpen: (ticket: SupportTicket) => void;
  onStatusChange: (id: string, status: SupportTicketStatus) => void;
}

function TicketColumn({
  title,
  icon: Icon,
  accentClass,
  tickets,
  onOpen,
  onStatusChange,
}: TicketColumnProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-secondary/20 p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("flex size-7 items-center justify-center rounded-lg", accentClass)}>
            <Icon className="size-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground shadow-sm">
          {tickets.length}
        </span>
      </div>

      <div className="scrollbar-thin flex max-h-[70vh] flex-col gap-3 overflow-y-auto px-0.5 py-1">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border px-4 py-10 text-center">
            <p className="text-xs text-muted-foreground">No tickets here</p>
          </div>
        ) : (
          tickets.map((ticket, i) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              index={i}
              onOpen={onOpen}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { TicketColumn };
