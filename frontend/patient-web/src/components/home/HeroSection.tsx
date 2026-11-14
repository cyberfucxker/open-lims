import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Download, Package, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import { useCityStore } from "@/store/cityStore";
import { cn } from "@/utils/cn";
import { buildCatalogPath } from "@/utils/routes";
import type { HomeBanner } from "@/types";

/** A slide as this hero needs it. `HomeBanner` satisfies it as-is; a city page
 *  adds the promo, which is the one thing a CITY banner carries that a Home
 *  one does not. */
interface HeroBanner extends HomeBanner {
  /** The promoted package, already named for the city it is being shown in
   *  ("Example Complete Care in Jaipur"). Built by the page, because the
   *  hero has no business deciding how a city is worded into a package name.
   *  Null on a slide with no package attached — a pure promo. */
  promoLabel?: string | null;
}

interface HeroSectionProps {
  /** The CMS slides for whichever masthead this is — `home_banners` on Home,
   *  the city list on a city page (Superadmin > CMS > Web Banner, "Shows on").
   *  Artwork only: this hero draws its own heading, search box and buttons
   *  over whatever is showing, so nothing is rendered from a banner's copy.
   *
   *  `undefined` while the query is in flight, and an empty array once it has
   *  loaded with nothing published — both fall back to the plain brand wash
   *  below, so the hero is never a blank rectangle. */
  banners?: HeroBanner[];
  /** Appended to the default heading ("Looking for a test in Jaipur?"), or
   *  interpolated into a page's own `heading` override below. Supplied by
   *  the page, not read from the store: only the page knows whether its URL is
   *  claiming a city, while the store always holds one because prices need
   *  it. */
  cityName?: string;
  /** Replaces the default "Looking for a test{ in city}?" heading — Home
   *  leaves this unset (keeps the generic, city-independent wording); a
   *  city page passes its own "Trusted Diagnostic Lab in {city}..." copy. */
  heading?: ReactNode;
  /** The line under the heading — hidden entirely when omitted (Home has
   *  none); a city page passes its own, which counts the tests its price
   *  list actually carries. */
  subtitle?: ReactNode;
  /** Replaces the "Popular:" search chips — a city page puts its trust row
   *  here instead. Kept as a slot rather than a flag because the two have
   *  nothing in common beyond the space they occupy. */
  footer?: ReactNode;
}

const POPULAR_SEARCHES = ["Full Body Checkup", "Thyroid", "Vitamin D", "CBC", "HbA1c"];

const AUTO_ADVANCE_MS = 5000;
const SWIPE_THRESHOLD = 60;
/** Same decelerate curve for every entrance and slide transition here, so the
 *  banner and the swipe read as one motion. */
const EASE_LIFT = [0.22, 1, 0.36, 1] as const;

/** Directional slide: enters/exits from whichever side matches the
 *  swipe/autoplay direction, so it reads as a physical carousel rather than a
 *  cross-fade. */
const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "8%" : "-8%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "-8%" : "8%", opacity: 0 }),
};

/** Shared CTA — drives traffic at the My Reports page.
 *
 *  Deliberately its own white/navy "medical-tech" look rather than the red
 *  brand palette: this is a distinct, premium utility action against a
 *  promotional wash, not another promo button.
 *
 *  The moving border is the outer `p-[3px]` ring: a conic-gradient spinning
 *  *behind* the pill, clipped by the wrapper's own `overflow-hidden
 *  rounded-full` to a travelling highlight right at the edge (the classic
 *  "animated gradient border" trick — the button itself is opaque and covers
 *  everything but that 3px ring). Plain CSS (`animate-spin` + a
 *  conic-gradient), deliberately not framer-motion: a JS-driven keyframe loop
 *  restarts on every re-render (the 5s autoplay tick, typing in the search
 *  box, …), so it would never visibly progress — this runs on the browser's
 *  own animation timeline, untouched by React. */
function ReportDownloadCta() {
  const navigate = useNavigate();
  const NAVY = "#1f3e6d";

  return (
    <span className="group relative inline-flex shrink-0 overflow-hidden rounded-full p-[3px]">
      <span
        aria-hidden
        className="absolute inset-[-60%] animate-spin"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(31,62,109,0.35) 72%, ${NAVY} 80%, rgba(31,62,109,0.35) 88%, transparent 98%)`,
          animationDuration: "3.2s",
        }}
      />
      <Button
        size="lg"
        className="relative z-10 h-10 rounded-full bg-white px-5 text-sm font-semibold shadow-sm transition-all duration-200 hover:bg-[#1f3e6d]/5 hover:shadow-[0_0_18px_-4px_rgba(31,62,109,0.45)] sm:h-12 sm:px-7 sm:text-[15px]"
        style={{ color: NAVY }}
        onClick={(e) => {
          // The slide behind this is clickable when the admin gave it a link,
          // and this button sits inside that click target — without stopping
          // propagation a tap here would fire both navigations and land on
          // whichever React Router processed last, not /reports.
          e.stopPropagation();
          navigate("/reports");
        }}
      >
        <Download className="size-4" style={{ color: NAVY }} />
        <span className="sm:hidden">Report</span>
        <span className="hidden sm:inline">Download Report</span>
      </Button>
    </span>
  );
}

/** The masthead for Home and for a city landing page.
 *
 *  One layout, because both pages are answering the same question — the
 *  artwork, and the thing everybody arrives to do: search. What differs is
 *  what the page feeds it: its own CMS banner list, its own heading and
 *  strapline, and its own footer row. Keeping them one component is what
 *  stops the two drifting into subtly different search boxes.
 *
 *  Everything over the image is fixed — only the picture behind it changes —
 *  because a search box that re-animated every five seconds would be
 *  unusable. */
function HeroSection({ banners, cityName, heading, subtitle, footer }: HeroSectionProps) {
  const navigate = useNavigate();
  const citySlug = useCityStore((s) => s.city?.slug);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const slides = banners ?? [];
  const hasSlides = slides.length > 0;

  // `active` can only ever go stale in one direction — an empty list giving
  // way to however many real slides just loaded — so clamp rather than reset
  // outright, which would restart the carousel on every re-render once the
  // lengths already match.
  useEffect(() => {
    setActive((current) => (slides.length > 0 && current >= slides.length ? 0 : current));
  }, [slides.length]);

  function goTo(next: number, dir: number) {
    if (slides.length === 0) return;
    setDirection(dir);
    setActive(((next % slides.length) + slides.length) % slides.length);
  }

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const id = setInterval(() => goTo(active + 1, 1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [active, isPaused, slides.length]);

  const slide = slides[active];

  function runSearch() {
    setShowSuggestions(false);
    const q = query.trim();
    navigate(q ? `/tests?q=${encodeURIComponent(q)}` : "/tests");
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x <= -SWIPE_THRESHOLD) goTo(active + 1, 1);
    else if (info.offset.x >= SWIPE_THRESHOLD) goTo(active - 1, -1);
  }

  return (
    // `mx-auto max-w-7xl px-4` matches QuickActions, PackagesSection and
    // CategoriesSection exactly, so the masthead sits on the same column the
    // rest of the page lines up on.
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:pt-8">
      <div
        className="relative w-full overflow-hidden rounded-3xl bg-primary"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* The artwork layer. Sized by the card, not the image: a fixed height
            keeps the overlay's position stable while pictures of different
            proportions rotate through behind it. */}
        <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[400px]">
          {hasSlides && slide && (
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={slide.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, ease: EASE_LIFT }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={handleDragEnd}
                onClick={() => slide.link_url && navigate(slide.link_url)}
                className={cn(
                  "absolute inset-0 cursor-grab active:cursor-grabbing",
                  // The drag cursor already reads as "grab this", which would
                  // contradict a pointer cursor — only promise a click when
                  // there is somewhere to go.
                  slide.link_url && "sm:cursor-pointer",
                )}
              >
                <img
                  src={slide.image}
                  alt=""
                  aria-hidden
                  className="size-full object-cover"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Legibility wash. Always painted, artwork or not: it is what the
              white heading and the two buttons sit on. Solid at the left edge
              where the text lives, clearing by the right third so a face or a
              product in the picture is still seen. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-primary from-0% via-primary/85 via-40% to-transparent to-75% sm:via-primary/70"
          />
        </div>

        {/* Fixed overlay — stays put while the pictures rotate behind it,
            instead of re-animating on every slide change. */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-4 py-5 sm:px-10 lg:px-16">
          <div className="max-w-xl">
            {/* The slide's promoted package. Lives in the fixed overlay
                rather than the sliding layer so it cannot be covered by the
                heading on a narrow screen — it is keyed on the slide id, so
                it still fades from one package to the next as the carousel
                turns. Clickable when the package has a page to go to; the
                whole card is clickable too, and this stops the tap firing
                both navigations. */}
            {slide?.promoLabel && (
              <motion.button
                key={slide.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_LIFT }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (slide.link_url) navigate(slide.link_url);
                }}
                className="mb-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-3 py-1 text-left text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/25 sm:mb-3 sm:text-[13px]"
              >
                <Package className="size-3.5 shrink-0" />
                <span className="truncate">{slide.promoLabel}</span>
              </motion.button>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_LIFT }}
              className="text-2xl leading-tight font-bold tracking-[-0.02em] text-primary-foreground text-balance sm:text-4xl"
            >
              {heading ?? `Looking for a test${cityName ? ` in ${cityName}` : ""}?`}
            </motion.h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-primary-foreground/80 sm:mt-2 sm:text-base">
                {subtitle}
              </p>
            )}

            <div
              ref={searchBarRef}
              className="relative mt-4 flex items-center gap-1.5 rounded-2xl bg-card p-1.5 shadow-lg sm:mt-5 sm:gap-3 sm:p-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-1.5 sm:gap-2.5 sm:px-4 sm:py-2">
                <Search className="size-4 shrink-0 text-primary sm:size-5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  // Delayed so a click on a suggestion below still registers —
                  // blur fires before that click's own handler otherwise.
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                    if (e.key === "Escape") setShowSuggestions(false);
                  }}
                  placeholder="Search a test, package or health concern…"
                  className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
                  aria-label="Search tests and packages"
                />
              </div>
              <Button
                className="h-9 shrink-0 rounded-xl px-4 text-sm font-semibold sm:h-10 sm:px-6 sm:text-[15px]"
                onClick={runSearch}
              >
                Search
              </Button>

              {showSuggestions && (
                <SearchSuggestions
                  query={query}
                  anchorRef={searchBarRef}
                  onNavigate={() => setShowSuggestions(false)}
                />
              )}
            </div>

            {/* The two destinations someone who did not come to search is
                after. Side by side at every width — they are peers, and
                stacking them on a phone would push the second one off the
                card. */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2.5 sm:mt-5 sm:gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="h-10 rounded-full px-5 text-sm font-semibold shadow-sm sm:h-12 sm:px-7 sm:text-[15px]"
                onClick={() => navigate(buildCatalogPath("packages", citySlug))}
              >
                <Package className="size-4" />
                Popular Packages
              </Button>
              <ReportDownloadCta />
            </div>

            {footer ?? (
              <div className="mt-3.5 hidden flex-wrap items-center gap-2 sm:flex">
                <span className="text-xs font-semibold text-primary-foreground/80">Popular:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => navigate(`/tests?q=${encodeURIComponent(term)}`)}
                    className="rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide indicators, below the card. */}
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              aria-current={i === active}
              onClick={() => goTo(i, i > active ? 1 : -1)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === active ? "size-2.5 bg-primary" : "size-1.5 bg-border hover:bg-primary/40",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export { HeroSection };
