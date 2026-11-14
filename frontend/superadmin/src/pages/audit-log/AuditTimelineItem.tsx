import {
  Banknote,
  Building2,
  CalendarClock,
  FileCog,
  Megaphone,
  Settings,
  ShieldCheck,
  UserCog,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusPill } from "@/components/common/StatusPill";
import { formatDateTime } from "@/lib/format";
import type { UserAppAuditLogEntry } from "@/lib/types";
import { cn } from "@/utils/cn";

const MODULE_ICONS: Record<string, LucideIcon> = {
  "Order Management": CalendarClock,
  "Payments & Transactions": Banknote,
  "Slot Management": CalendarClock,
  "Test & Package Management": FileCog,
  "Customer Management": UserCog,
  "Wallet Management": Wallet,
  "CMS Pages": Building2,
  Notifications: Megaphone,
  Settings: Settings,
};

interface AuditTimelineItemProps {
  entry: UserAppAuditLogEntry;
  isLast: boolean;
}

function AuditTimelineItem({ entry, isLast }: AuditTimelineItemProps) {
  const Icon = MODULE_ICONS[entry.module] ?? ShieldCheck;

  return (
    <div className="relative flex gap-3.5 pb-6 last:pb-0">
      {!isLast && (
        <span className="absolute top-9 left-[15px] h-[calc(100%-12px)] w-px bg-border" />
      )}
      <div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">{entry.actor}</span>
            <span className="text-muted-foreground">{entry.action}</span>
          </div>
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {formatDateTime(entry.at)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={entry.module} />
          <span className={cn("font-mono text-xs text-muted-foreground")}>
            Target: {entry.target}
          </span>
          <span className="font-mono text-xs text-muted-foreground">IP {entry.ip}</span>
        </div>
      </div>
    </div>
  );
}

export { AuditTimelineItem };
