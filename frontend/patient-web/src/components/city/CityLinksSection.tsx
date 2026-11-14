import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { CarouselArrows, CarouselDots } from "@/components/common/CarouselControls";
import { useCities } from "@/hooks/queries/useCities";
import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { buildCityPath } from "@/utils/routes";

const AUTO_ADVANCE_MS = 3500;

interface CityLinksSectionProps {
  /** The city being viewed — left out of the list, since linking a page to
   *  itself is noise for a reader and a wasted internal link for a crawler. */
  currentSlug: string;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/** Links out to every other city landing page.
 *
 *  This is the reason city pages are worth having as separate URLs at all: it
 *  puts each one within a click of the others, so a crawler that finds any
 *  single city page finds the whole set, and a visitor on the wrong one can
 *  fix it without touching the picker.
 *
 *  A carousel rather than the old wrapping grid — the full city list runs to
 *  50+ entries, which as a static grid meant many rows of low-value links
 *  pushing real page content down; paging keeps the same reach (still every
 *  city, still a single click away) in a fixed, glanceable height. */
function CityLinksSection({ currentSlug }: CityLinksSectionProps) {
  const { data: cities } = useCities();
  const others = (cities ?? []).filter((c) => c.slug !== currentSlug);
  const isDesktop = useIsDesktop();
  // Auto-advance is phone-only, same reasoning as the home page's category
  // row: on desktop 5 cities already show at once and the arrows are the
  // expected way to page through the rest.
  const { trackRef, page, pageCount, goToPage } = useHorizontalCarousel({
    autoAdvanceMs: isDesktop ? undefined : AUTO_ADVANCE_MS,
  });

  if (others.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Example Diagnostics Lab in other cities
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Same tests, same labs, same home collection — priced for each city.
          </p>
        </div>
        <CarouselArrows
          page={page}
          pageCount={pageCount}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
        />
      </div>

      <motion.div
        ref={trackRef}
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain py-2 scroll-smooth sm:gap-2.5"
      >
        {others.map((city) => (
          <motion.div
            key={city.id}
            variants={itemVariants}
            className="w-[calc((100%-0.5rem)/2)] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/3)] lg:w-[calc((100%-2.5rem)/5)]"
          >
            <Link
              to={buildCityPath(city.slug)}
              className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="truncate">{city.name}</span>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <CarouselDots page={page} pageCount={pageCount} onGoTo={goToPage} />
    </section>
  );
}

export { CityLinksSection };
