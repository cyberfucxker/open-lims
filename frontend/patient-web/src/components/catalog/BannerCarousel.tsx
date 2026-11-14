import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import type { AppBanner } from "@/types";

interface BannerCarouselProps {
  banners: AppBanner[];
}

function BannerCarousel({ banners }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 4000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <div>
      {/* Fixed aspect-ratio (not a fixed height) so `object-cover` below always
          crops the exact same fraction of the source image at every viewport
          width — upload banners at this same 3:1 ratio (e.g. 1200x400px) and
          nothing gets cropped/stretched differently on phone vs laptop. */}
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-2xl shadow-md">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={banners[index].id}
            drag={reducedMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) setIndex((i) => (i + 1) % count);
              else if (info.offset.x > 60) setIndex((i) => (i - 1 + count) % count);
            }}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <img
              src={banners[index].image}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { BannerCarousel };
