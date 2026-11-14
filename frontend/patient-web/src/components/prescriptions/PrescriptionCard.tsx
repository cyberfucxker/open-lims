import { motion } from "framer-motion";
import { CalendarDays, ExternalLink, MapPin, Phone, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { formatBookingDate } from "@/utils/format";
import { EASE_OUT_EXPO } from "@/utils/motion";
import type { PrescriptionItem } from "@/types";

import { PRESCRIPTION_STATUS_META } from "./prescriptionStatus";

interface PrescriptionCardProps {
  prescription: PrescriptionItem;
  index?: number;
  onDelete: (id: string) => void;
}

function PrescriptionCard({ prescription, index = 0, onDelete }: PrescriptionCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const meta = PRESCRIPTION_STATUS_META[prescription.status];
  const StatusIcon = meta.icon;
  const patientName = prescription.name ?? "Family member";

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
                {prescription.status === "SUBMITTED" && (
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(prescription.id)}
            aria-label={`Delete prescription for ${patientName}`}
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="space-y-3 py-4 pr-4 pl-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/15"
            >
              {patientName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] leading-snug font-semibold">{patientName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {prescription.relation ?? "—"}
                {prescription.phone && (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Phone className="size-3" />
                      {prescription.phone}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {formatBookingDate(prescription.created_at)}
            </span>
            {prescription.city?.name && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="size-3.5" />
                {prescription.city.name}
              </span>
            )}
          </div>

          {prescription.query && (
            <p className="rounded-lg border-l-2 border-border bg-muted/30 py-2 pr-3 pl-3 text-xs leading-relaxed text-muted-foreground">
              {prescription.query}
            </p>
          )}

          {/* `file_url` was resolved by prescriptionApi but never surfaced — without this
              there was no way to see what had actually been uploaded. */}
          {prescription.file_url && (
            <Button variant="outline" size="sm" className="h-9 w-full" asChild>
              <a href={prescription.file_url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                View prescription
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export { PrescriptionCard };
