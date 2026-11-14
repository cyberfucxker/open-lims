import { motion } from "framer-motion";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/format";
import type { SupportTicket, SupportTicketStatus } from "@/services/api/supportTicketApi";

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CLOSED", label: "Closed" },
];

interface TicketCardProps {
  ticket: SupportTicket;
  index: number;
  onOpen: (ticket: SupportTicket) => void;
  onStatusChange: (id: string, status: SupportTicketStatus) => void;
}

function TicketCard({ ticket, index, onOpen, onStatusChange }: TicketCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onOpen(ticket)}
      className="cursor-pointer rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="font-mono text-[11px] text-muted-foreground">{ticket.ticketNumber}</span>

      <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">{ticket.subject}</p>
      <p className="mt-1 text-xs text-muted-foreground">{ticket.customerName}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {formatRelativeTime(ticket.createdAt)}
        </span>
      </div>

      <div className="mt-3 border-t border-border/70 pt-2.5" onClick={(e) => e.stopPropagation()}>
        <Select
          value={ticket.status}
          onValueChange={(v) => onStatusChange(ticket.id, v as SupportTicketStatus)}
        >
          <SelectTrigger className="h-8 w-full text-xs">
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
      </div>
    </motion.div>
  );
}

export { TicketCard };
