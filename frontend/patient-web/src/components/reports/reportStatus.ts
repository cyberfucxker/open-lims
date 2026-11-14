import { CheckCircle2, FlaskConical, Lock, type LucideIcon } from "lucide-react";

import type { ThirdPartyReportItem } from "@/types";

export type ReportStatus = "READY" | "PAYMENT_DUE" | "PROCESSING";

/** Derives a report's single display state from the partner-lab payload.
 *
 *  Order is significant and matches the original row logic exactly: an outstanding
 *  balance wins over everything, because the lab withholds the PDF until it's cleared.
 *  Only once the balance is zero does `pdfUrl` decide between released and still-processing
 *  (the API sends an empty string, not null, for an unreleased report). */
export function getReportStatus(report: ThirdPartyReportItem): ReportStatus {
  if (report.balanceAmt > 0) return "PAYMENT_DUE";
  return report.pdfUrl ? "READY" : "PROCESSING";
}

interface ReportStatusMeta {
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Classes for each surface the status paints on a report card. */
  rail: string;
  strip: string;
  medallion: string;
  pill: string;
  dot: string;
}

export const REPORT_STATUS_META: Record<ReportStatus, ReportStatusMeta> = {
  READY: {
    label: "Ready",
    hint: "Digitally verified · ready to download",
    icon: CheckCircle2,
    rail: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    strip: "bg-emerald-500/[0.06]",
    medallion:
      "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400",
    pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  PAYMENT_DUE: {
    label: "Payment due",
    hint: "Clear the balance to unlock this report",
    icon: Lock,
    rail: "bg-gradient-to-b from-amber-400 to-amber-600",
    strip: "bg-amber-500/[0.07]",
    medallion: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400",
    pill: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  PROCESSING: {
    label: "Processing",
    hint: "Your sample is being analysed at the lab",
    icon: FlaskConical,
    rail: "bg-gradient-to-b from-sky-400 to-sky-600",
    strip: "bg-sky-500/[0.06]",
    medallion: "bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400",
    pill: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
};
