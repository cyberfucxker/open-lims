import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shaped like the grouped slot grid (period heading +
 *  chip rows) so the layout doesn't jump when availability arrives. */
function SlotSkeleton({ groups = 2, perGroup = 3 }: { groups?: number; perGroup?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: groups }).map((_, g) => (
        <div key={g}>
          <div className="mb-2.5 flex items-center gap-2">
            <Skeleton className="size-7 shrink-0 rounded-lg" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: perGroup }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { SlotSkeleton };
