import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shaped like the confirmation cards so the layout
 *  doesn't jump once the order detail arrives. */
function ConfirmationSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <Skeleton className="mb-3 h-3.5 w-32" />
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  );
}

export { ConfirmationSkeleton };
