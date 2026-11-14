import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

import { CarouselArrows, CarouselDots } from "@/components/common/CarouselControls";
import { CategoryChip } from "@/components/catalog/CategoryChip";
import { Skeleton } from "@/components/ui/skeleton";
import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import type { CategoryItem } from "@/types";

const AUTO_ADVANCE_MS = 3500;

interface CategoriesSectionProps {
  categories?: CategoryItem[];
  isLoading: boolean;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function CategoriesSection({ categories, isLoading }: CategoriesSectionProps) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  // Full cards only, never a sliver of the next one — 3 to a view on a phone,
  // 6 in a single row on desktop, exactly. Auto-advance is phone-only: on
  // desktop the row already shows every category at once most of the time,
  // and the arrows are the expected way to page through the rest.
  const { trackRef, page, pageCount, goToPage } = useHorizontalCarousel({
    autoAdvanceMs: isDesktop ? undefined : AUTO_ADVANCE_MS,
  });

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutGrid className="size-4" />
          </span>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Test Based on Lifestyle &amp; Conditions
          </h2>
        </div>
        <CarouselArrows
          page={page}
          pageCount={pageCount}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
        />
      </motion.div>

      {isLoading ? (
        // Matches the live layout's per-view counts so the skeleton doesn't
        // jump on load: 3 on a phone, 6 in a row on desktop.
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl sm:h-24" />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            ref={trackRef}
            variants={listVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain py-2 scroll-smooth sm:gap-3"
          >
            {categories?.map((category) => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                className="w-[calc((100%-2*0.5rem)/3)] shrink-0 snap-start sm:w-[calc((100%-5*0.75rem)/6)]"
              >
                <CategoryChip
                  category={category}
                  size="lg"
                  onClick={() => navigate(`/tests?category=${category.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>

          <CarouselDots page={page} pageCount={pageCount} onGoTo={goToPage} />
        </>
      )}
    </section>
  );
}

export { CategoriesSection };
