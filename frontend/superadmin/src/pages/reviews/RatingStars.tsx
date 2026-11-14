import { Star } from "lucide-react";

import { cn } from "@/utils/cn";

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
        <Star
          key={n}
          className={cn(
            starSize,
            n <= rating ? "fill-warning text-warning" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

export { RatingStars };
