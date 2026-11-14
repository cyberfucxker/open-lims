import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { UserAppReview } from "@/lib/types";

function RatingDistributionBar({ reviews }: { reviews: UserAppReview[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);
  const max = Math.max(1, ...counts);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Rating Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 pt-4">
        {[5, 4, 3, 2, 1].map((star, i) => (
          <div key={star} className="flex items-center gap-2.5">
            <span className="flex w-8 shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground">
              {star}
              <Star className="size-3 fill-warning text-warning" />
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(counts[i] / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {formatNumber(counts[i])}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { RatingDistributionBar };
