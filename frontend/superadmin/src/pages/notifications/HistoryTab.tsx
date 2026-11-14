import { useMemo, useState } from "react";
import { History } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { SidePanel } from "@/components/common/SidePanel";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { UserAppNotificationCampaign, UserAppNotificationTemplate } from "@/lib/types";
import { cn } from "@/utils/cn";

import { CHANNEL_ICONS, CHANNEL_TONE_CLASSES, channelLabel } from "./notificationHelpers";

interface HistoryTabProps {
  campaigns: UserAppNotificationCampaign[];
  templates: UserAppNotificationTemplate[];
}

function DeliveryBar({ stats }: { stats: UserAppNotificationCampaign["stats"] }) {
  const total = Math.max(stats.sent, 1);
  const readPct = (stats.read / total) * 100;
  const deliveredNotReadPct = (Math.max(stats.delivered - stats.read, 0) / total) * 100;
  const failedPct = (stats.failed / total) * 100;

  return (
    <div className="flex h-1.5 w-full min-w-[110px] overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-brand-violet" style={{ width: `${readPct}%` }} />
      <div className="h-full bg-success" style={{ width: `${deliveredNotReadPct}%` }} />
      <div className="h-full bg-destructive" style={{ width: `${failedPct}%` }} />
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-destructive"
        : tone === "info"
          ? "text-brand-violet"
          : "text-foreground";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-xs font-semibold tabular-nums", toneClass)}>
        {formatNumber(value)}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function HistoryTab({ campaigns, templates }: HistoryTabProps) {
  const [selected, setSelected] = useState<UserAppNotificationCampaign | null>(null);

  const sorted = useMemo(
    () =>
      [...campaigns].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),
    [campaigns],
  );

  const templateFor = (id: string) => templates.find((t) => t.id === id);

  const columns: DataTableColumn<UserAppNotificationCampaign>[] = [
    {
      key: "name",
      header: "Campaign",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.audience}</p>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (row) => {
        const Icon = CHANNEL_ICONS[row.channel];
        return (
          <div
            className={cn(
              "flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              CHANNEL_TONE_CLASSES[row.channel],
            )}
          >
            <Icon className="size-3.5" />
            {channelLabel(row.channel)}
          </div>
        );
      },
    },
    {
      key: "sentAt",
      header: "Sent",
      render: (row) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateTime(row.sentAt)}
        </span>
      ),
    },
    {
      key: "stats",
      header: "Delivery",
      className: "min-w-[220px]",
      render: (row) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <StatChip label="Sent" value={row.stats.sent} />
            <StatChip label="Delivered" value={row.stats.delivered} tone="success" />
            <StatChip label="Read" value={row.stats.read} tone="info" />
            <StatChip label="Failed" value={row.stats.failed} tone="danger" />
          </div>
          <DeliveryBar stats={row.stats} />
        </div>
      ),
    },
  ];

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No campaigns sent yet"
        description="Campaigns you send will show up here with delivery stats."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={sorted}
        rowKey={(row) => row.id}
        onRowClick={setSelected}
        pageSize={8}
      />

      <SidePanel
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `Sent ${formatDateTime(selected.sentAt)}` : undefined}
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("flex items-center gap-1", CHANNEL_TONE_CLASSES[selected.channel])}
              >
                {(() => {
                  const Icon = CHANNEL_ICONS[selected.channel];
                  return <Icon className="size-3" />;
                })()}
                {channelLabel(selected.channel)}
              </Badge>
              <Badge variant="secondary">{selected.audience}</Badge>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Template used</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {templateFor(selected.templateId)?.name ?? "Custom message (no saved template)"}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Delivery funnel
              </p>
              <DeliveryBar stats={selected.stats} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatChip label="Sent" value={selected.stats.sent} />
                <StatChip label="Delivered" value={selected.stats.delivered} tone="success" />
                <StatChip label="Read" value={selected.stats.read} tone="info" />
                <StatChip label="Failed" value={selected.stats.failed} tone="danger" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {Math.round((selected.stats.delivered / Math.max(selected.stats.sent, 1)) * 100)}%
                </p>
                <p className="text-[11px] text-muted-foreground">Delivery rate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {Math.round((selected.stats.read / Math.max(selected.stats.delivered, 1)) * 100)}%
                </p>
                <p className="text-[11px] text-muted-foreground">Read rate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {Math.round((selected.stats.failed / Math.max(selected.stats.sent, 1)) * 100)}%
                </p>
                <p className="text-[11px] text-muted-foreground">Failure rate</p>
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

export { HistoryTab };
