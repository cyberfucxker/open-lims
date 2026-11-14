import { useEffect, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useApproveReport,
  useMarkReportPrinted,
  useReportDetails,
} from "@/hooks/queries/useReports";
import { downloadBlob } from "@/services/api/billApi";
import { fetchReportPdfBlob } from "@/services/api/report.api";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

interface ReportPreviewDialogProps {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReportPreviewDialog({ reportId, open, onOpenChange }: ReportPreviewDialogProps) {
  const { data: report, isLoading } = useReportDetails(open ? reportId : null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const markPrinted = useMarkReportPrinted();
  const approveReport = useApproveReport();

  useEffect(() => {
    if (!open || !reportId) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsPdfLoading(true);
    fetchReportPdfBlob(reportId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load report preview");
      })
      .finally(() => {
        if (!cancelled) setIsPdfLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfUrl(null);
    };
  }, [open, reportId]);

  const handleDownload = async () => {
    if (!report) return;
    try {
      const blob = await fetchReportPdfBlob(report.id);
      downloadBlob(blob, `${report.reportNo}.pdf`);
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handlePrint = () => {
    if (!pdfUrl || !report) return;
    const printWindow = window.open(pdfUrl, "_blank");
    printWindow?.addEventListener("load", () => printWindow.print());
    markPrinted.mutate(report.id);
  };

  const handleApprove = () => {
    if (!report) return;
    approveReport.mutate(report.id, {
      onSuccess: () => toast.success(`${report.reportNo} approved`),
      onError: (error) =>
        toast.error(error instanceof ApiRequestError ? error.message : "Failed to approve"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4">
        <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <DialogTitle>{report ? report.reportNo : "Report Preview"}</DialogTitle>
            {report && <p className="text-xs text-muted-foreground">{report.patient.fullName}</p>}
          </div>
          {report && (
            <StatusBadge
              status={titleCaseStatus(report.status)}
              variant={sampleReportBadgeVariant(report.status)}
            />
          )}
        </DialogHeader>

        {isLoading || !report ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="min-h-[420px] flex-1 overflow-hidden rounded-xl border border-border bg-secondary/30">
            {isPdfLoading || !pdfUrl ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <iframe src={pdfUrl} title={`Report ${report.reportNo}`} className="h-full w-full" />
            )}
          </div>
        )}

        {report && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" asChild>
              <Link to={`/admin/reports/${report.id}/entry`}>Open Report Entry</Link>
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="size-4" /> Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={!pdfUrl}>
              <Printer className="size-4" /> Print
            </Button>
            {report.status === "SUBMITTED" && (
              <Button onClick={handleApprove} disabled={approveReport.isPending}>
                {approveReport.isPending && <Loader2 className="size-4 animate-spin" />}
                Approve
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { ReportPreviewDialog };
