import { useCallback, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./useMediaQuery";

interface UseHorizontalCarouselOptions {
  /** When set, advances one page at a time on this interval and loops back
   *  to the first page from the last — paused for as long as the user is
   *  actively touching/dragging the track, and skipped entirely when the OS
   *  asks for reduced motion. Omit (the default) for a purely manual
   *  arrows/dots/swipe carousel. */
  autoAdvanceMs?: number;
}

/** Drives a scroll-snap carousel track without hard-coding how many cards fit
 *  per breakpoint — "one page" is measured off the rendered layout itself
 *  (`scrollWidth / clientWidth`), so arrows and dots always agree with
 *  whatever the CSS actually shows, on any screen size or zoom level. Used by
 *  every horizontal card row on the home page (categories, reviews, our
 *  presence) so their paging behaves identically.
 *
 *  `trackRef` is a callback ref, not a `RefObject` — every caller just does
 *  `ref={trackRef}` and never reads `.current` themselves, so this is
 *  transparent either way. It matters internally: the track's row is almost
 *  always behind a loading skeleton for its first render (categories,
 *  reviews, etc. all come from an async fetch), so the real element doesn't
 *  exist yet on mount. A plain `useRef` never notices it show up later — a
 *  ref write doesn't trigger a re-render — so measurement would silently
 *  freeze at `pageCount: 1` forever. Holding the node in state instead means
 *  its arrival *is* a re-render, and every effect below keyed on it re-runs
 *  right on schedule. */
export function useHorizontalCarousel<T extends HTMLElement = HTMLDivElement>(
  options: UseHorizontalCarouselOptions = {},
) {
  const { autoAdvanceMs } = options;
  const [trackEl, setTrackEl] = useState<T | null>(null);
  const trackRef = useCallback((node: T | null) => setTrackEl(node), []);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isInteracting, setIsInteracting] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const measure = useCallback(() => {
    if (!trackEl || trackEl.clientWidth === 0) return;
    setPageCount(Math.max(1, Math.round(trackEl.scrollWidth / trackEl.clientWidth)));
    setPage(Math.round(trackEl.scrollLeft / trackEl.clientWidth));
  }, [trackEl]);

  useEffect(() => {
    if (!trackEl) return;
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(trackEl);

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    trackEl.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      trackEl.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [trackEl, measure]);

  const goToPage = useCallback(
    (next: number) => {
      if (!trackEl) return;
      const clamped = Math.max(0, Math.min(pageCount - 1, next));
      trackEl.scrollTo({ left: clamped * trackEl.clientWidth, behavior: "smooth" });
    },
    [trackEl, pageCount],
  );

  // Pauses auto-advance for as long as a finger/cursor is down on the track,
  // so it never fights a swipe-in-progress or yanks the page out from under
  // someone mid-read. `pointerdown`/`pointerup` cover touch and mouse alike.
  useEffect(() => {
    if (!trackEl || !autoAdvanceMs) return;

    const pause = () => setIsInteracting(true);
    const resume = () => setIsInteracting(false);
    trackEl.addEventListener("pointerdown", pause);
    trackEl.addEventListener("pointerup", resume);
    trackEl.addEventListener("pointercancel", resume);
    return () => {
      trackEl.removeEventListener("pointerdown", pause);
      trackEl.removeEventListener("pointerup", resume);
      trackEl.removeEventListener("pointercancel", resume);
    };
  }, [trackEl, autoAdvanceMs]);

  useEffect(() => {
    if (!autoAdvanceMs || prefersReducedMotion || isInteracting || pageCount <= 1) return;
    const id = setInterval(() => goToPage((page + 1) % pageCount), autoAdvanceMs);
    return () => clearInterval(id);
  }, [autoAdvanceMs, prefersReducedMotion, isInteracting, page, pageCount, goToPage]);

  return { trackRef, page, pageCount, goToPage };
}
