import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/utils/cn";

interface CarouselArrowsProps {
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

/** A pair of prev/next buttons, faded (not hidden) at either end so their
 *  position never shifts as a row is scrolled. */
function CarouselArrows({ page, pageCount, onPrev, onNext, className }: CarouselArrowsProps) {
  if (pageCount <= 1) return null;
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <button
        type="button"
        aria-label="Previous"
        onClick={onPrev}
        disabled={page <= 0}
        className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={onNext}
        disabled={page >= pageCount - 1}
        className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

interface CarouselDotsProps {
  page: number;
  pageCount: number;
  onGoTo: (page: number) => void;
  className?: string;
}

function CarouselDots({ page, pageCount, onGoTo, className }: CarouselDotsProps) {
  if (pageCount <= 1) return null;
  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      {Array.from({ length: pageCount }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to page ${i + 1}`}
          onClick={() => onGoTo(i)}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === page ? "w-6 bg-primary" : "w-1.5 bg-border",
          )}
        />
      ))}
    </div>
  );
}

export { CarouselArrows, CarouselDots };
