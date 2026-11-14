import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useReportDetails } from "@/hooks/queries/useReports";
import { downloadBlob } from "@/services/api/billApi";
import { fetchCombinedReportPdfBlob } from "@/services/api/report.api";

interface CombinedReportPreviewDialogProps {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CombinedReportPreviewDialog({
  reportId,
  open,
  onOpenChange,
}: CombinedReportPreviewDialogProps) {
  const { data: report, isLoading } = useReportDetails(open ? reportId : null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [withLetterhead, setWithLetterhead] = useState(false);
  const [withPageBreak, setWithPageBreak] = useState(true);
  const [withDepartmentWise, setWithDepartmentWise] = useState(false);
  const [withVitals, setWithVitals] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const approvedTests = report?.testResults.filter((t) => t.status === "APPROVED") ?? [];

  useEffect(() => {
    if (!report) return;
    setSelectedIds(
      new Set(report.testResults.filter((t) => t.status === "APPROVED").map((t) => t.resultId)),
    );
  }, [report]);

  useEffect(() => {
    if (!open || !reportId || selectedIds.size === 0) {
      setPdfUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsPdfLoading(true);
    fetchCombinedReportPdfBlob(reportId, [...selectedIds], {
      withLetterhead,
      withPageBreak,
      withDepartmentWise,
      withVitals,
    })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to generate combined preview");
      })
      .finally(() => {
        if (!cancelled) setIsPdfLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, reportId, selectedIds, withLetterhead, withPageBreak, withDepartmentWise, withVitals]);

  const toggleSelected = (resultId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) next.delete(resultId);
      else next.add(resultId);
      return next;
    });
  };

  const allSelected =
    approvedTests.length > 0 && approvedTests.every((t) => selectedIds.has(t.resultId));

  const handleDownload = async () => {
    if (!reportId || selectedIds.size === 0) return;
    try {
      const blob = await fetchCombinedReportPdfBlob(reportId, [...selectedIds], {
        withLetterhead,
        withPageBreak,
        withDepartmentWise,
        withVitals,
      });
      downloadBlob(blob, `${report?.reportNo ?? "combined"}.pdf`);
    } catch {
      toast.error("Failed to download combined report");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-6xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Reports — {report?.patient.fullName ?? "…"}</DialogTitle>
        </DialogHeader>

        {isLoading || !report ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[260px_1fr]">
            <div className="flex flex-col gap-3 overflow-y-auto rounded-xl border border-border p-3">
              <label className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    setSelectedIds(
                      checked ? new Set(approvedTests.map((t) => t.resultId)) : new Set(),
                    )
                  }
                />
                Select All
              </label>
              {approvedTests.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No tests on this bill are Approved yet.
                </p>
              ) : (
                approvedTests.map((t) => (
                  <label key={t.resultId} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedIds.has(t.resultId)}
                      onCheckedChange={() => toggleSelected(t.resultId)}
                    />
                    <span className="flex-1 truncate">{t.testName}</span>
                    <Badge variant="success" className="text-[10px]">
                      Approved
                    </Badge>
                  </label>
                ))
              )}

              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                <label className="flex items-center justify-between text-sm">
                  With Letterhead
                  <Switch checked={withLetterhead} onCheckedChange={setWithLetterhead} />
                </label>
                <label className="flex items-center justify-between text-sm">
                  With Page Break
                  <Switch checked={withPageBreak} onCheckedChange={setWithPageBreak} />
                </label>
                <label className="flex items-center justify-between text-sm">
                  With Department Wise
                  <Switch checked={withDepartmentWise} onCheckedChange={setWithDepartmentWise} />
                </label>
                <label className="flex items-center justify-between text-sm">
                  With Vitals
                  <Switch checked={withVitals} onCheckedChange={setWithVitals} />
                </label>
              </div>

              <Button
                variant="outline"
                className="mt-2"
                onClick={handleDownload}
                disabled={selectedIds.size === 0}
              >
                <Download className="size-4" /> Download
              </Button>
            </div>

            <div className="min-h-[420px] overflow-hidden rounded-xl border border-border bg-secondary/30">
              {selectedIds.size === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select at least one Approved test to preview
                </div>
              ) : isPdfLoading || !pdfUrl ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <iframe src={pdfUrl} title="Combined report preview" className="h-full w-full" />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { CombinedReportPreviewDialog };
