import { Skeleton } from "@/components/ui/skeleton";

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors the detail page's hero + two-column panel layout so nothing jumps on load. */
function OrderDetailSkeleton() {
  return (
    <div aria-hidden>
      <div className="border-b border-border bg-accent/30">
        <div className="mx-auto max-w-5xl space-y-3 px-4 pt-6 pb-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-56" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-4 px-4 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-4">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={2} />
        </div>
        <div className="space-y-4">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}

export { OrderDetailSkeleton };
