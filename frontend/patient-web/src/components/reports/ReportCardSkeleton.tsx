import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

/** Mirrors the strip / body geometry of ThirdPartyReportRow so the list doesn't reflow
 *  when the partner-lab fetch lands. */
function ReportCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 py-3 pr-4 pl-5">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-3 w-14 shrink-0" />
      </div>
      <div className="flex items-center justify-between gap-3 py-4 pr-4 pl-5">
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

function ReportCardSkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:gap-4 xl:grid-cols-2", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <ReportCardSkeleton key={i} />
      ))}
    </div>
  );
}

export { ReportCardSkeleton, ReportCardSkeletonList };
