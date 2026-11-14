import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageUp, UploadCloud, X } from "lucide-react";

import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

export const SCREENSHOT_ACCEPT = "image/png,image/jpeg,image/webp";
const SCREENSHOT_ACCEPT_LABEL = "PNG, JPG or WEBP";
const SCREENSHOT_MAX_SIZE_LABEL = "5 MB";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ScreenshotDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
  disabled?: boolean;
}

/** Drag-and-drop attachment field for the Feedback/Complaints form. Optional —
 *  the backend accepts tickets with no screenshot (see
 *  `supportTicket.controller#reportIssue`), since plenty of real complaints
 *  ("phlebo never arrived", "wrong report") have nothing to photograph. */
function ScreenshotDropzone({ file, onChange, error, disabled = false }: ScreenshotDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={SCREENSHOT_ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      <AnimatePresence mode="wait" initial={false}>
        {file ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
          >
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-card ring-1 ring-border">
              {previewUrl ? (
                <img src={previewUrl} alt="" aria-hidden className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageUp className="size-5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatFileSize(file.size)}
              </p>
              <button
                type="button"
                onClick={openPicker}
                disabled={disabled}
                className="mt-0.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Replace file
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label="Remove selected file"
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="dropzone"
            type="button"
            onClick={openPicker}
            disabled={disabled}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) onChange(dropped);
            }}
            className={cn(
              "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center outline-none transition-colors focus-visible:ring-4 focus-visible:ring-ring",
              isDragging
                ? "border-primary bg-primary/5"
                : error
                  ? "border-destructive/50 bg-destructive/[0.03] hover:bg-destructive/[0.06]"
                  : "border-input hover:border-primary/40 hover:bg-accent",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-11 items-center justify-center rounded-full transition-colors",
                isDragging ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <UploadCloud className="size-5" />
            </span>
            <span className="text-sm font-semibold">
              {isDragging ? "Drop to attach" : "Drag a screenshot here, or browse"}
            </span>
            <span className="text-xs text-muted-foreground">
              {SCREENSHOT_ACCEPT_LABEL} · up to {SCREENSHOT_MAX_SIZE_LABEL} · optional
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export { ScreenshotDropzone };
