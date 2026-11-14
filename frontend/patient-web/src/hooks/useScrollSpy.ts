import { useEffect, useRef, useState } from "react";

/** Tracks which of several sections (by element id) is currently most
 *  visible, for a sticky nav strip that highlights to match scroll position
 *  (e.g. the About page's Inception/Brand/Management Team/CEO Statement
 *  tabs). Starts on `ids[0]` and only moves on from there once a section
 *  actually intersects — so the first section stays the default until the
 *  user scrolls, rather than flashing to whichever mounts first.
 *
 *  `rootMargin` should pull the detection band in below any sticky headers
 *  (e.g. "-170px 0px -55% 0px") so a section only counts as current once
 *  it's past them, not merely peeking out from underneath. */
export function useScrollSpy(ids: string[], options?: { rootMargin?: string }): string {
  const [activeId, setActiveId] = useState(ids[0]);
  const ratios = useRef(new Map<string, number>());
  const idsKey = ids.join(",");

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    ratios.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.current.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestId: string | null = null;
        let bestRatio = 0;
        for (const id of ids) {
          const ratio = ratios.current.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      { rootMargin: options?.rootMargin ?? "0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ids` compared via `idsKey`
  }, [idsKey, options?.rootMargin]);

  return activeId;
}
