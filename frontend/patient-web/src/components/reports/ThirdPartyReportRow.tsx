import { motion } from "framer-motion";
import { Download, IndianRupee, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { formatRupees } from "@/utils/format";
import { EASE_OUT_EXPO } from "@/utils/motion";
import type { ThirdPartyReportItem } from "@/types";

import { REPORT_STATUS_META, getReportStatus } from "./reportStatus";

interface ThirdPartyReportRowProps {
  report: ThirdPartyReportItem;
  index?: number;
  onPay: (report: ThirdPartyReportItem) => void;
  isPaying?: boolean;
  onDownload: (report: ThirdPartyReportItem) => void;
  isDownloading?: boolean;
}

function ThirdPartyReportRow({
  report,
  index = 0,
  onPay,
  isPaying = false,
  onDownload,
  isDownloading = false,
}: ThirdPartyReportRowProps) {
  const reduceMotion = usePrefersReducedMotion();

  const status = getReportStatus(report);
  const meta = REPORT_STATUS_META[status];
  const StatusIcon = meta.icon;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05, ease: EASE_OUT_EXPO }}
    >
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-black/[0.06]">
        <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", meta.rail)} />

        <div
          className={cn(
            "flex items-center gap-3 border-b border-border/70 py-3 pr-4 pl-5",
            meta.strip,
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              meta.medallion,
            )}
          >
            <StatusIcon className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                meta.pill,
              )}
            >
              <span className="relative flex size-1.5 shrink-0">
                {status === "PROCESSING" && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 animate-ping rounded-full opacity-75",
                      meta.dot,
                    )}
                  />
                )}
                <span className={cn("relative size-1.5 rounded-full", meta.dot)} />
              </span>
              {meta.label}
            </span>
            <p className="mt-1 truncate text-xs text-muted-foreground">{meta.hint}</p>
          </div>
          <span className="shrink-0 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
            #{report.testRegnId}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-4 pr-4 pl-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/15"
            >
              {report.patientName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] leading-snug font-semibold">
                {report.patientName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Lab <span className="font-medium text-foreground">{report.labCode}</span>
                {report.amountPaid > 0 && <> · {formatRupees(report.amountPaid)} paid</>}
              </p>
            </div>
          </div>

          {status === "PAYMENT_DUE" ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[17px] leading-tight font-bold text-amber-600 tabular-nums dark:text-amber-400">
                  {formatRupees(report.balanceAmt)}
                </p>
                <p className="text-[11px] text-muted-foreground">Balance due</p>
              </div>
              <Button
                size="sm"
                className="h-10 px-4"
                onClick={() => onPay(report)}
                disabled={isPaying}
              >
                {isPaying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <IndianRupee className="size-4" />
                )}
                {isPaying ? "Processing" : "Pay & unlock"}
              </Button>
            </div>
          ) : status === "READY" ? (
            <Button
              size="sm"
              className="h-10 px-4"
              onClick={() => onDownload(report)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {isDownloading ? "Downloading" : "Download"}
            </Button>
          ) : (
            /* Processing: no action exists yet — an explicit note beats a dead button. */
            <p className="text-xs font-medium text-muted-foreground">Available once released</p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export { ThirdPartyReportRow };
