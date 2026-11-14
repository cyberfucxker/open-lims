import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shaped like `AddressCard` so the list doesn't reflow
 *  when data lands — the generic `SkeletonCards` was a plain block. */
function AddressSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { AddressSkeleton };
