import { History, Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSampleHistory } from "@/hooks/queries/useSamples";
import type { SampleRecord } from "@/types/sample";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

interface SampleHistorySheetProps {
  sample: SampleRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SampleHistorySheet({ sample, open, onOpenChange }: SampleHistorySheetProps) {
  const { data: history, isLoading } = useSampleHistory(open ? (sample?.id ?? null) : null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <History className="size-5" />
            </div>
            <div>
              <SheetTitle>Sample History</SheetTitle>
              <p className="text-xs text-muted-foreground">{sample?.sampleNo}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history recorded yet.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {entry.fromStatus && (
                      <StatusBadge
                        status={titleCaseStatus(entry.fromStatus)}
                        variant={sampleReportBadgeVariant(entry.fromStatus)}
                      />
                    )}
                    {entry.fromStatus && <span className="text-muted-foreground">→</span>}
                    <StatusBadge
                      status={titleCaseStatus(entry.toStatus)}
                      variant={sampleReportBadgeVariant(entry.toStatus)}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                {entry.note && <p className="mt-1.5 text-xs text-muted-foreground">{entry.note}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  By {entry.performedBy ?? "System"}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { SampleHistorySheet };
