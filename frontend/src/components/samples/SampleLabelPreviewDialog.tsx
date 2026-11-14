import { useEffect, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadBlob } from "@/services/api/billApi";
import { fetchSampleLabelPdfBlob } from "@/services/api/sample.api";
import type { SampleRecord } from "@/types/sample";

interface SampleLabelPreviewDialogProps {
  sample: SampleRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SampleLabelPreviewDialog({ sample, open, onOpenChange }: SampleLabelPreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !sample) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsLoading(true);
    fetchSampleLabelPdfBlob(sample.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load label preview");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfUrl(null);
    };
  }, [open, sample]);

  const handleDownload = async () => {
    if (!sample) return;
    try {
      const blob = await fetchSampleLabelPdfBlob(sample.id);
      downloadBlob(blob, `${sample.sampleNo}-label.pdf`);
    } catch {
      toast.error("Failed to download label");
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, "_blank");
    printWindow?.addEventListener("load", () => printWindow.print());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] w-full max-w-md flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Tube Label — {sample?.sampleNo}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/30">
          {isLoading || !pdfUrl ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <iframe src={pdfUrl} title={`Label ${sample?.sampleNo}`} className="h-64 w-full" />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
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

export { SampleLabelPreviewDialog };
