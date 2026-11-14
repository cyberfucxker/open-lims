import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-7 w-24" />
      <Skeleton className="mt-2 h-3.5 w-32" />
    </div>
  );
}

export { StatCardSkeleton };
