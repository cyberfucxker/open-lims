import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

/** Mirrors the strip / body / footer geometry of OrderListItem so the list doesn't
 *  reflow when real bookings land. */
function OrderCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 py-3 pr-4 pl-5">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
      </div>

      <div className="space-y-3.5 py-4 pr-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-36 rounded-lg" />
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/70 bg-muted/30 py-2.5 pr-4 pl-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function OrderCardSkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:gap-4 xl:grid-cols-2", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

export { OrderCardSkeleton, OrderCardSkeletonList };
