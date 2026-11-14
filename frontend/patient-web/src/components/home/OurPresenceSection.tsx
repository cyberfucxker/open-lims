import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CarouselDots } from "@/components/common/CarouselControls";
import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";
import { OUR_PRESENCE_CITIES } from "@/mocks/data/homeContent";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.015 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/** One reusable landmark glyph (a haveli/fort silhouette) rather than 56
 *  distinct city illustrations — every card shows the same mark, exactly like
 *  the reference design, so it reads as "a city of ours" rather than trying
 *  (and failing) to be a real per-city icon set. */
function LandmarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path d="M16 2.5 13.7 6h4.6z" fill="currentColor" />
      <path d="M16 5.5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M8 12.5c0-2.4 1.8-4.3 4-4.3s4 1.9 4 4.3M16 12.5c0-2.4 1.8-4.3 4-4.3s4 1.9 4 4.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6.5 12.5h19v13.5a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12.3 27V20a3.7 3.7 0 0 1 7.4 0v7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 16.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0" stroke="currentColor" strokeWidth="1.3" />
      <path d="M19 16.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 27h25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function OurPresenceSection() {
  // Pages are measured off the rendered layout rather than hard-coded per
  // breakpoint — however many cards actually fit in one viewport width (2-3
  // on a phone, 8 on desktop, per the responsive card widths below) becomes
  // "one page" for the arrows and dots, so the two can never drift apart.
  const { trackRef, page, pageCount, goToPage } = useHorizontalCarousel();

  return (
    <section className="mx-auto max-w-7xl px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mb-5 text-center"
      >
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Serving patients across {OUR_PRESENCE_CITIES.length}+ cities
        </h2>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted-foreground">
          From Rajasthan to towns across North &amp; Central India — home sample collection wherever
          you are.
        </p>
      </motion.div>

      {/* Track + floating arrows share this wrapper so the buttons can sit
          just outside the card edges, overlapping the row like the reference
          design, instead of living up in the header. */}
      <div className="relative">
        <motion.div
          ref={trackRef}
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain py-2 scroll-smooth [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] lg:gap-4"
        >
          {OUR_PRESENCE_CITIES.map((city) => (
            <motion.div
              key={city}
              variants={cardVariants}
              whileHover={{ y: -3 }}
              className="w-[calc((100%-0.75rem)/2.15)] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/3.15)] lg:w-[calc((100%-7*1rem)/8)]"
            >
              <div className="flex cursor-default flex-col items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-5 text-center shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LandmarkIcon className="size-7" />
                </span>
                <span className="truncate text-sm font-bold text-foreground">{city}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {pageCount > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous cities"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 0}
              className="absolute top-1/2 -left-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-all hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-0 sm:-left-4"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next cities"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount - 1}
              className="absolute top-1/2 -right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-all hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-0 sm:-right-4"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      <CarouselDots page={page} pageCount={pageCount} onGoTo={goToPage} className="mt-4" />
    </section>
  );
}

export { OurPresenceSection };
