import { useEffect, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadBlob } from "@/services/api/billApi";

interface PortalDocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  downloadFilename: string;
  fetchBlob: () => Promise<Blob>;
}

/** Read-only PDF preview + download + print — the Collection Center portal's
 *  equivalent of the admin `InvoicePreviewDialog`/`ReportPreviewDialog`, but
 *  without any of their admin-only actions (edit charges, send, approve,
 *  mark-printed). Reuses the same blob-fetch + object-URL pattern as
 *  `SampleLabelPreviewDialog` instead of duplicating it a third time. */
function PortalDocumentPreviewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  downloadFilename,
  fetchBlob,
}: PortalDocumentPreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsLoading(true);
    fetchBlob()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load preview");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfUrl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, downloadFilename]);

  const handleDownload = async () => {
    try {
      const blob = await fetchBlob();
      downloadBlob(blob, downloadFilename);
    } catch {
      toast.error("Failed to download");
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, "_blank");
    printWindow?.addEventListener("load", () => printWindow.print());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </DialogHeader>

        <div className="min-h-[420px] flex-1 overflow-hidden rounded-xl border border-border bg-secondary/30">
          {isLoading || !pdfUrl ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe src={pdfUrl} title={title} className="h-full w-full" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="size-4" /> Download
          </Button>
          <Button onClick={handlePrint} disabled={!pdfUrl}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { PortalDocumentPreviewDialog };
