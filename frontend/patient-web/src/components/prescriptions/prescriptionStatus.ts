import { CheckCircle2, Clock3, XCircle, type LucideIcon } from "lucide-react";

import type { PrescriptionStatus } from "@/types";

/** Accepted upload types, kept in sync with the backend by hand.
 *
 *  `uploadPrescriptionFile` in `backend/src/middleware/appUpload.middleware.ts` uses
 *  `imageFileFilter`, whose IMAGE_MIME_TYPES set is exactly PNG / JPEG / WEBP — it does NOT
 *  accept PDFs, despite the old UI's file input advertising them. Widen the backend filter
 *  first if PDF prescriptions should be supported. */
export const PRESCRIPTION_ACCEPT = "image/png,image/jpeg,image/webp";
export const PRESCRIPTION_ACCEPT_LABEL = "PNG, JPG or WEBP";
/** Mirrors the middleware's `limits.fileSize` of 5 * 1024 * 1024. */
export const PRESCRIPTION_MAX_SIZE_LABEL = "5 MB";

interface PrescriptionStatusMeta {
  label: string;
  hint: string;
  icon: LucideIcon;
  rail: string;
  strip: string;
  medallion: string;
  pill: string;
  dot: string;
}

/** The API returns raw enum keys (SUBMITTED / APPROVED / REJECTED); this maps them to
 *  patient-facing wording and the colour bucket each one paints with. */
export const PRESCRIPTION_STATUS_META: Record<PrescriptionStatus, PrescriptionStatusMeta> = {
  SUBMITTED: {
    label: "Under review",
    hint: "Our team is checking this prescription",
    icon: Clock3,
    rail: "bg-gradient-to-b from-sky-400 to-sky-600",
    strip: "bg-sky-500/[0.06]",
    medallion: "bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400",
    pill: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  APPROVED: {
    label: "Approved",
    hint: "We'll reach out to confirm the tests to book",
    icon: CheckCircle2,
    rail: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    strip: "bg-emerald-500/[0.06]",
    medallion:
      "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400",
    pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    hint: "Please upload a clearer copy of the prescription",
    icon: XCircle,
    rail: "bg-gradient-to-b from-destructive/60 to-destructive",
    strip: "bg-destructive/[0.05]",
    medallion: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
    pill: "border-destructive/20 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};
