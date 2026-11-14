import { FlaskConical, Package as PackageIcon } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { usePackageDetail, useTestDetail } from "@/hooks/queries/useCatalogDetail";
import type { CatalogParameterDetail } from "@/services/api/catalogDetailApi";

import { BookableBadge } from "./BookableBadge";

/** Read-only publish preview for a Test or a Package.
 *
 *  Both variants read the same `/details` endpoints the patient app reads, so
 *  what an admin sanity-checks here is literally what a customer will be served
 *  — that's the whole point of the shared service behind them, and why this is a
 *  separate view from the edit form rather than a tab inside it. */

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function PriceBlock({ price, offerPrice }: { price: number; offerPrice: number | null }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={
          offerPrice != null
            ? "text-sm text-muted-foreground line-through tabular-nums"
            : "text-lg font-semibold text-foreground tabular-nums"
        }
      >
        {formatCurrency(price)}
      </span>
      {offerPrice != null && (
        <span className="text-lg font-semibold text-success tabular-nums">
          {formatCurrency(offerPrice)}
        </span>
      )}
    </div>
  );
}

function ParameterList({ parameters }: { parameters: CatalogParameterDetail[] }) {
  const bookableCount = parameters.filter((p) => p.bookable).length;

  if (parameters.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
        No parameters attached — this reports as a single free-text result line.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {parameters.length} parameter{parameters.length === 1 ? "" : "s"} · {bookableCount} bookable
        on their own, so the patient app shows "+ Add" on{" "}
        {bookableCount === 1 ? "that one" : "those"} and renders the rest as plain list items.
      </p>
      <ol className="flex flex-col gap-1.5">
        {parameters.map((parameter, index) => (
          <li
            key={parameter.id}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{parameter.name}</span>
              <span className="text-xs text-muted-foreground">{parameter.shortName}</span>
            </div>
            <BookableBadge bookable={parameter.bookable} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

interface TestDetailDialogProps {
  testId: string | null;
  onOpenChange: (open: boolean) => void;
}

function TestDetailDialog({ testId, onOpenChange }: TestDetailDialogProps) {
  const { data, isLoading, isError, error } = useTestDetail(testId);

  return (
    <Dialog open={!!testId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data ? data.name : "Test details"}</DialogTitle>
          <DialogDescription>
            Exactly what the patient app is served for this test — read-only.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <DetailSkeleton />
        ) : isError || !data ? (
          <EmptyState
            icon={FlaskConical}
            title="Couldn't load test details"
            description={error instanceof Error ? error.message : "Something went wrong."}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className="w-fit">
                  {data.shortName}
                </Badge>
                <PriceBlock price={data.price} offerPrice={data.offerPrice} />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                <DetailField label="Category" value={data.appCategory ?? "—"} />
                <DetailField label="Sample Type" value={data.sampleType} />
                <DetailField label="Report Time" value={data.reportTime} />
                {/* The lab's internal taxonomy is optional now, so it's only
                    shown when a Test actually carries one. */}
                <DetailField label="Department" value={data.department ?? "—"} />
              </div>
            </div>

            {data.description && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Description</span>
                <p className="text-sm text-foreground">{data.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Parameters</span>
              <ParameterList parameters={data.parameters} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PackageDetailDialogProps {
  packageId: string | null;
  onOpenChange: (open: boolean) => void;
}

function PackageDetailDialog({ packageId, onOpenChange }: PackageDetailDialogProps) {
  const { data, isLoading, isError, error } = usePackageDetail(packageId);

  return (
    <Dialog open={!!packageId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data ? data.name : "Package details"}</DialogTitle>
          <DialogDescription>
            Every test and parameter this package contains — read-only.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <DetailSkeleton />
        ) : isError || !data ? (
          <EmptyState
            icon={PackageIcon}
            title="Couldn't load package details"
            description={error instanceof Error ? error.message : "Something went wrong."}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <PriceBlock price={data.price} offerPrice={data.offerPrice} />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                <DetailField label="Category" value={data.appCategory ?? "—"} />
                <DetailField label="Sample Type" value={data.sampleType ?? "Mixed"} />
                <DetailField label="Report Time" value={data.reportTime ?? "—"} />
                <DetailField
                  label="Fasting"
                  value={
                    data.isFastingRequired
                      ? data.fastingHours
                        ? `${data.fastingHours} hours`
                        : "Required"
                      : "Not required"
                  }
                />
              </div>
            </div>

            {(data.recommendedAge || data.recommendedFor !== "BOTH") && (
              <p className="text-xs text-muted-foreground">
                Recommended for {data.recommendedFor.toLowerCase()}
                {data.recommendedAge && ` · ${data.recommendedAge}`}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                Included Tests ({data.tests.length})
              </span>
              {data.tests.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                  No tests — this package sells standalone parameters only, so it isn't bookable
                  through the app yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.tests.map((test) => (
                    <Badge key={test.id} variant="secondary" className="gap-1.5">
                      {test.name}
                      <span className="text-muted-foreground">{test.shortName}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">All Parameters Covered</span>
              <ParameterList parameters={data.parameters} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { PackageDetailDialog, TestDetailDialog };
