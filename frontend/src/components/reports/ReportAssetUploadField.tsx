import { useRef } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useUploadReportAsset } from "@/hooks/queries/useReportSettings";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReportAssetType } from "@/types/report";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/api\/v1\/?$/, "");

interface ReportAssetUploadFieldProps {
  label: string;
  assetType: ReportAssetType;
  path: string | null;
}

/** One "upload an image" control — logo/header/footer/watermark/signature
 *  all reuse this instead of duplicating the same thumbnail+button JSX 5x.
 *  Uploads immediately on file select (same UX the logo field always had),
 *  which invalidates the `reportSettings` query and — via that — refreshes
 *  the live preview automatically. */
function ReportAssetUploadField({ label, assetType, path }: ReportAssetUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAsset = useUploadReportAsset();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAsset.mutateAsync({ assetType, file });
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : `Failed to upload ${label.toLowerCase()}`,
      );
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {path ? (
        <img
          src={`${API_ORIGIN}${path}`}
          alt={label}
          className="h-12 w-20 rounded border border-border bg-white object-contain p-1"
        />
      ) : (
        <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed border-border text-muted-foreground">
          <ImagePlus className="size-4" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={handleChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAsset.isPending}
        >
          {uploadAsset.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {uploadAsset.isPending ? "Uploading…" : path ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  );
}

export { ReportAssetUploadField };
