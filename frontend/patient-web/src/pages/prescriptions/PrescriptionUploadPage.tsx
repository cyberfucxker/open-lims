import { useState } from "react";
import { CheckCircle2, Clock3, FileText, ShieldCheck, XCircle } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHero, PageHeroChip } from "@/components/common/PageHero";
import { StatTiles, type StatTile } from "@/components/common/StatTiles";
import { PrescriptionCard } from "@/components/prescriptions/PrescriptionCard";
import { PrescriptionCardSkeletonList } from "@/components/prescriptions/PrescriptionCardSkeleton";
import { PrescriptionUploadCard } from "@/components/prescriptions/PrescriptionUploadCard";
import { usePrescriptions, useRemovePrescription } from "@/hooks/queries/usePrescriptions";
import type { PrescriptionItem } from "@/types";

/** Counts by review state, derived from the list already fetched — no extra request. */
function buildTiles(prescriptions: PrescriptionItem[]): StatTile[] {
  let submitted = 0;
  let approved = 0;
  let rejected = 0;

  for (const item of prescriptions) {
    if (item.status === "APPROVED") approved += 1;
    else if (item.status === "REJECTED") rejected += 1;
    else submitted += 1;
  }

  return [
    {
      label: "Under review",
      value: String(submitted),
      icon: Clock3,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "Approved",
      value: String(approved),
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Rejected",
      value: String(rejected),
      icon: XCircle,
      iconClass: "bg-destructive/10 text-destructive",
    },
  ];
}

function PrescriptionUploadPage() {
  const { data, isLoading } = usePrescriptions();
  const removeMutation = useRemovePrescription();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const prescriptions = data ?? [];

  return (
    <div className="pb-10">
      <PageHero
        eyebrow={
          <PageHeroChip icon={<ShieldCheck className="size-3.5" />}>
            Reviewed by our clinical team
          </PageHeroChip>
        }
        title="Prescriptions"
        description="Send us a doctor's prescription and we'll set up the right tests for you — no need to work out which panel you need."
      >
        {prescriptions.length > 0 && (
          <StatTiles tiles={buildTiles(prescriptions)} isLoading={isLoading} />
        )}
      </PageHero>

      <div className="mx-auto max-w-5xl px-4 pt-5">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,370px)_minmax(0,1fr)] lg:gap-6">
          {/* Sticky against the published navbar height so the form stays reachable while
              a long history scrolls beside it. */}
          <div className="lg:sticky lg:top-[calc(var(--top-nav-height)+1rem)]">
            <PrescriptionUploadCard />
          </div>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-bold tracking-tight">Your submissions</h2>
              <p className="text-xs text-muted-foreground">
                Every prescription you've sent us, newest first
              </p>
            </div>

            {isLoading ? (
              <PrescriptionCardSkeletonList count={2} />
            ) : prescriptions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No prescriptions yet"
                description="Upload one using the form and it'll show up here with its review status."
              />
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {prescriptions.map((prescription, i) => (
                  <PrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                    index={i}
                    onDelete={setPendingDeleteId}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete this prescription?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDeleteId) removeMutation.mutate(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

export { PrescriptionUploadPage };
