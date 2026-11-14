import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useReportSettings } from "@/hooks/queries/useReportSettings";
import { downloadBlob } from "@/services/api/billApi";
import { fetchReportSettingsPreviewBlob } from "@/services/api/reportSettings.api";
import type { ReportSettingsFormValues } from "@/types/report";

interface ReportDesignerPreviewProps {
  values: ReportSettingsFormValues;
}

const PAGE_ASPECT: Record<string, string> = {
  A4: "210 / 297",
  LETTER: "8.5 / 11",
};

/** The right-hand pane of the Report Designer: renders the exact same PDF
 *  the server would produce for a real report with the given (possibly
 *  unsaved) settings, debounced ~400ms after the last change — same
 *  blob/iframe/cancellation-flag pattern as `InvoicePreviewDialog.tsx`. */
function ReportDesignerPreview({ values }: ReportDesignerPreviewProps) {
  const { data: settings } = useReportSettings();
  const [debouncedValues, setDebouncedValues] = useState(values);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValues(values), 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchReportSettingsPreviewBlob(debouncedValues)
      .then((blob) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to refresh preview");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-fetch when the debounced form values change OR when an asset
    // upload updates the saved settings (image paths aren't form fields).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debouncedValues), settings?.updatedAt]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleDownloadSample = async () => {
    try {
      const blob = await fetchReportSettingsPreviewBlob(debouncedValues, "attachment");
      downloadBlob(blob, "sample-report.pdf");
    } catch {
      toast.error("Failed to download sample PDF");
    }
  };

  const handlePrintPreview = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, "_blank");
    printWindow?.addEventListener("load", () => printWindow.print());
  };

  return (
    <div className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Live Preview</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadSample}>
            <Download className="size-3.5" /> Download Sample PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintPreview}
            disabled={!pdfUrl}
          >
            <Printer className="size-3.5" /> Print Preview
          </Button>
        </div>
      </div>

      <div
        className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-lg border border-border bg-secondary/30"
        style={{ aspectRatio: PAGE_ASPECT[values.pageSize] ?? PAGE_ASPECT.A4 }}
      >
        {pdfUrl && <iframe src={pdfUrl} title="Report preview" className="h-full w-full" />}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 text-sm text-muted-foreground backdrop-blur-[1px]">
            <Loader2 className="size-4 animate-spin" /> Regenerating…
          </div>
        )}
        {!pdfUrl && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Loading preview…
          </div>
        )}
      </div>
    </div>
  );
}

export { ReportDesignerPreview };
