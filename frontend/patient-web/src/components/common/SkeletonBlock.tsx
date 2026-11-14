import { Skeleton } from "@/components/ui/skeleton";

function SkeletonRows({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-4">
          <Skeleton className="mb-3 h-4 w-2/3" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export { SkeletonRows, SkeletonCards };
