import { motion } from "framer-motion";
import { MessageSquareQuote, Stethoscope, Star, UserRound } from "lucide-react";

import { CarouselArrows, CarouselDots } from "@/components/common/CarouselControls";
import { useHorizontalCarousel } from "@/hooks/useHorizontalCarousel";
import { DOCTOR_REVIEWS, PATIENT_REVIEWS } from "@/mocks/data/homeContent";
import type { DoctorReview, PatientReview } from "@/mocks/data/homeContent";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="size-3.5" fill={i < rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

/** One carousel row — patient or doctor reviews share this shell; only the
 *  card body differs (location + package taken vs. specialty). */
function ReviewRow<
  T extends { id: string; name: string; rating: number; text: string; avatar: string },
>({
  icon: Icon,
  title,
  items,
  renderMeta,
}: {
  icon: typeof UserRound;
  title: string;
  items: T[];
  renderMeta: (item: T) => string;
}) {
  const { trackRef, page, pageCount, goToPage } = useHorizontalCarousel();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </h3>
        <CarouselArrows
          page={page}
          pageCount={pageCount}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
        />
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain py-3 scroll-smooth"
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            className="w-full shrink-0 snap-start sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-2*1rem)/3)]"
          >
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg">
              <StarRow rating={item.rating} />
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-border pt-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="size-10 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{renderMeta(item)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <CarouselDots page={page} pageCount={pageCount} onGoTo={goToPage} />
    </div>
  );
}

function ReviewsSection() {
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
          <MessageSquareQuote className="size-3.5" />
          Reviews
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Loved by patients across Rajasthan
        </h2>
      </motion.div>

      <ReviewRow<PatientReview>
        icon={UserRound}
        title="What patients say"
        items={PATIENT_REVIEWS}
        renderMeta={(review) => `${review.location} · ${review.packageTaken}`}
      />

      <ReviewRow<DoctorReview>
        icon={Stethoscope}
        title="What doctors say"
        items={DOCTOR_REVIEWS}
        renderMeta={(review) => review.specialty}
      />
    </section>
  );
}

export { ReviewsSection };
