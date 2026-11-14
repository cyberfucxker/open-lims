import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

/** Mirrors PrescriptionCard's strip / body geometry so the list doesn't reflow on load. */
function PrescriptionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 py-3 pr-4 pl-5">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-lg" />
      </div>
      <div className="space-y-3 py-4 pr-4 pl-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

function PrescriptionCardSkeletonList({
  count = 2,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:gap-4", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <PrescriptionCardSkeleton key={i} />
      ))}
    </div>
  );
}

export { PrescriptionCardSkeleton, PrescriptionCardSkeletonList };
