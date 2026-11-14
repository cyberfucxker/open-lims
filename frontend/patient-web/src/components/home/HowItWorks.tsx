import { motion } from "framer-motion";
import { Route } from "lucide-react";

import { CarouselDots } from "@/components/common/CarouselControls";
import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { HOW_IT_WORKS_STEPS } from "@/mocks/data/homeContent";

const AUTO_ADVANCE_MS = 3500;

function HowItWorks() {
  const isDesktop = useIsDesktop();
  // The carousel track only exists at all below `sm` (see the "sm:hidden"
  // wrapper further down — sm and up is a static grid instead), so this is
  // already a no-op on desktop; passing `undefined` there too just keeps
  // that intent explicit rather than relying on it incidentally.
  const { trackRef, page, pageCount, goToPage } = useHorizontalCarousel<HTMLDivElement>({
    autoAdvanceMs: isDesktop ? undefined : AUTO_ADVANCE_MS,
  });

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="space-y-2 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Route className="size-3.5" />
          How it works
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          From booking to report, in 4 easy steps
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          A simple, transparent journey designed around your convenience.
        </p>
      </motion.div>

      {/* Phone: swipeable one-card-at-a-time carousel */}
      <div className="space-y-4 sm:hidden">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain py-2 scroll-smooth"
        >
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex w-full shrink-0 snap-start flex-col items-center gap-3 text-center"
              >
                <span className="relative flex size-[4.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-lg shadow-primary/25">
                  <Icon className="size-7" />
                  <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-card text-xs font-bold text-primary shadow-sm ring-2 ring-primary/20">
                    {i + 1}
                  </span>
                </span>
                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                <p className="max-w-56 text-xs text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
        <CarouselDots page={page} pageCount={pageCount} onGoTo={goToPage} />
      </div>

      {/* Tablet and up: static grid */}
      <div className="relative hidden sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <div
          aria-hidden
          className="absolute top-9 right-0 left-0 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block"
        />
        {HOW_IT_WORKS_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center gap-3 text-center"
            >
              <span className="relative flex size-[4.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-lg shadow-primary/25">
                <Icon className="size-7" />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-card text-xs font-bold text-primary shadow-sm ring-2 ring-primary/20">
                  {i + 1}
                </span>
              </span>
              <h3 className="text-sm font-bold text-foreground sm:text-base">{step.title}</h3>
              <p className="max-w-56 text-xs text-muted-foreground sm:text-sm">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export { HowItWorks };
