import { useState } from "react";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiLog } from "@/hooks/queries/useWhatsapp";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AiLogEntryDto } from "@/services/api/whatsappApi";
import { cn } from "@/utils/cn";

type Filter = "all" | "error" | "handoff" | "dry";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  replied: "success",
  handoff: "warning",
  error: "destructive",
  skipped: "secondary",
};

function usd(n: number | null) {
  return n == null ? "—" : `$${n < 0.01 ? n.toFixed(5) : n.toFixed(3)}`;
}

function Entry({ entry }: { entry: AiLogEntryDto }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={STATUS_VARIANT[entry.status] ?? "secondary"}>{entry.status}</Badge>
        {entry.handoff && <Badge variant="warning">handoff</Badge>}
        {entry.dryRun && <Badge variant="info">try-it</Badge>}
        <span>{formatDateTime(entry.createdAt)}</span>
        <span>
          · {entry.conversation?.contactName || entry.conversation?.contactPhone || "Superadmin"}
        </span>
        <span>· {entry.model}</span>
        <span>
          · in {formatNumber(entry.inputTokens)} / cached {formatNumber(entry.cacheReadTokens)} /
          out {formatNumber(entry.outputTokens)}
        </span>
        <span>· {usd(entry.costUsd)}</span>
      </div>
      <p className="text-sm">
        <span className="font-medium">Q:</span> {entry.question}
      </p>
      {entry.answer && (
        <p className="text-sm whitespace-pre-wrap">
          <span className="font-medium">A:</span> {entry.answer}
        </p>
      )}
      {entry.error && <p className="text-xs text-destructive">{entry.error}</p>}
      {(entry.toolCalls?.length ?? 0) > 0 && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "Show"} {entry.toolCalls!.length} tool call
            {entry.toolCalls!.length > 1 ? "s" : ""}
          </Button>
          {open && (
            <div className="mt-1 flex flex-col gap-1">
              {entry.toolCalls!.map((t, i) => (
                <pre
                  key={i}
                  className={cn(
                    "overflow-x-auto rounded-lg bg-muted p-2 text-[11px] whitespace-pre-wrap",
                    !t.ok && "border border-destructive/40",
                  )}
                >
                  {t.name}({JSON.stringify(t.input)}){"\n"}→ {t.result}
                </pre>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AiLogTab() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const params =
    filter === "error"
      ? { status: "error" }
      : filter === "handoff"
        ? { handoff: true }
        : filter === "dry"
          ? { dryRun: true }
          : {};
  const { data, isLoading } = useAiLog({ ...params, page });
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / 25));

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(["all", "error", "handoff", "dry"] as Filter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
              >
                {{ all: "All", error: "Errors", handoff: "Handoffs", dry: "Try-it runs" }[f]}
              </Button>
            ))}
          </div>
          {data && (
            <p className="text-xs text-muted-foreground">
              Last 30 days: {formatNumber(data.last30Days.replies)} replies · est.{" "}
              {usd(data.last30Days.costUsd)}
            </p>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : !data?.entries.length ? (
          <EmptyState icon={ScrollText} title="Nothing logged yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {data.entries.map((e) => (
              <Entry key={e.id} entry={e} />
            ))}
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              {page} / {pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { AiLogTab };
