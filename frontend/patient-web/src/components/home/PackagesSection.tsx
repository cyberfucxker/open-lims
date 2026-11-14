import { motion } from "framer-motion";
import { Inbox, PackageCheck } from "lucide-react";

import { CarouselArrows } from "@/components/common/CarouselControls";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCards, SkeletonRows } from "@/components/common/SkeletonBlock";
import { PackageCard } from "@/components/catalog/PackageCard";
import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";
import type { PackageCatalogItem } from "@/types";

interface PackagesSectionProps {
  isLoading: boolean;
  isError: boolean;
  packages?: PackageCatalogItem[];
  /** Names the city in the heading ("Popular Health Packages in Jaipur").
   *  Comes from
   *  the caller, not the store, because the caller knows whether this page is
   *  ABOUT a city: `CityPage` always is, `HomePage` only when its URL carries
   *  a slug. Reading the store here would name whichever city happened to be
   *  selected for pricing — which is why clearing the slug out of the URL
   *  used to leave "in Jodhpur" sitting on a page that no longer claimed it. */
  cityName?: string;
}

function PackagesSection({ isLoading, isError, packages, cityName }: PackagesSectionProps) {
  // Arrows only (no auto-advance) — a desktop row this wide rarely fits
  // every card, and dragging/swiping isn't the expected desktop interaction
  // the way it is on a phone.
  const { trackRef, page, pageCount, goToPage } = useHorizontalCarousel();

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
            <PackageCheck className="size-4" />
          </span>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Popular Health Packages{cityName ? ` in ${cityName}` : ""}
          </h2>
        </div>
        <CarouselArrows
          page={page}
          pageCount={pageCount}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
          className="hidden sm:flex"
        />
      </motion.div>

      {isLoading ? (
        <SkeletonCards
          count={4}
          className="scrollbar-thin flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain py-3 [&>*]:min-w-64 [&>*]:shrink-0"
        />
      ) : isError || !packages ? (
        <SkeletonRows count={3} />
      ) : packages.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No packages available"
          description="Check back soon — new packages are added regularly."
        />
      ) : (
        <div
          ref={trackRef}
          className="scrollbar-thin flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain py-3"
        >
          {packages.map((pkg, i) => (
            <div key={pkg.id} className="min-w-64 shrink-0 snap-start sm:min-w-72">
              <PackageCard pkg={pkg} index={i} variant="premium" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export { PackagesSection };
