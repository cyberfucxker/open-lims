import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shaped like the real cart layout (item cards on the
 *  left, summary panel on the right) so the page doesn't reflow when data
 *  lands — the generic `SkeletonRows` didn't match the new two-column grid. */
function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:gap-4"
          >
            <Skeleton className="size-11 shrink-0 rounded-xl sm:size-12" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="size-9 shrink-0 rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    </div>
  );
}

export { CartSkeleton };
