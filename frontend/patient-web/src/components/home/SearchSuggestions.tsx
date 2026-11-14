import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Loader2, PackageSearch, SearchX } from "lucide-react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { catalogApi } from "@/services/api/catalogApi";
import { useCityStore } from "@/store/cityStore";
import { formatRupees } from "@/utils/format";
import { buildCatalogItemPath } from "@/utils/routes";
import type { PackageCatalogItem, TestCatalogItem } from "@/types";

const MIN_QUERY_LENGTH = 2;

interface SearchSuggestionsProps {
  query: string;
  /** The search bar's own wrapper — the dropdown is portalled to `document.body`
   *  and positioned off this element's live bounding rect (see `useAnchorRect`),
   *  rather than living inside it, so it isn't clipped by the Hero banner's
   *  `overflow-hidden` (needed for the slide carousel's own transitions). */
  anchorRef: RefObject<HTMLElement | null>;
  /** Called once a suggestion is picked (or the dropdown should otherwise
   *  close) — the caller owns the actual open/closed state. */
  onNavigate: () => void;
}

/** Tracks `anchorEl`'s position/width live — on mount, and on any resize or
 *  scroll anywhere on the page, so a portalled `position: fixed` panel stays
 *  glued under the input through both. */
function useAnchorRect(anchorRef: RefObject<HTMLElement | null>) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    function update() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom, left: r.left, width: r.width });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  return rect;
}

/** Home page search box's live dropdown — top 5 Tests + top 5 Packages
 *  matching what's typed, each a straight shortcut to that item's detail
 *  page (where Add to Cart already lives; this dropdown doesn't duplicate
 *  it). "Tests" here already includes every directly-bookable, curated
 *  `isCommonlyUsed` Parameter alongside real Tests — same backend query as
 *  the Tests catalogue browse (`GET /user/search-suggestions`), so a
 *  Parameter that isn't independently bookable, or is but isn't curated,
 *  never shows up here. */
function SearchSuggestions({ query, anchorRef, onNavigate }: SearchSuggestionsProps) {
  const navigate = useNavigate();
  const citySlug = useCityStore((s) => s.city?.slug);
  const cityId = useCityStore((s) => s.city?.id);
  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmed = debouncedQuery.trim();
  const enabled = trimmed.length >= MIN_QUERY_LENGTH;
  const rect = useAnchorRect(anchorRef);

  const { data, isFetching } = useQuery({
    queryKey: ["search-suggestions", trimmed, cityId ?? null],
    queryFn: () => catalogApi.searchSuggestions(trimmed, cityId),
    enabled,
    placeholderData: (previous) => previous,
  });

  if (query.trim().length < MIN_QUERY_LENGTH || !rect) return null;

  const tests = data?.tests ?? [];
  const packages = data?.packages ?? [];
  const hasResults = tests.length > 0 || packages.length > 0;

  function goToTest(test: TestCatalogItem) {
    onNavigate();
    // Search deliberately surfaces uncurated bookable Parameters too (see
    // `catalogApi.searchSuggestions`), so this list carries more
    // `is_parameter` rows than the catalogue browse does.
    navigate(
      buildCatalogItemPath({
        kind: "tests",
        id: test.id,
        slug: test.slug,
        citySlug,
        isParameter: test.is_parameter,
      }),
    );
  }

  function goToPackage(pkg: PackageCatalogItem) {
    onNavigate();
    navigate(buildCatalogItemPath({ kind: "packages", id: pkg.id, slug: pkg.slug, citySlug }));
  }

  return createPortal(
    <div
      role="listbox"
      aria-label="Search suggestions"
      style={{ top: rect.top + 8, left: rect.left, width: rect.width }}
      className="fixed z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-2 text-left shadow-xl"
    >
      {isFetching && !data ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching…
        </div>
      ) : !hasResults ? (
        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
          <SearchX className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No results for "{trimmed}"</p>
        </div>
      ) : (
        <>
          {tests.length > 0 && (
            <div className="mb-1">
              <p className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Tests
              </p>
              {tests.map((test) => (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => goToTest(test)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-accent"
                >
                  <FlaskConical className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {test.test_name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatRupees(test.offer_price)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {packages.length > 0 && (
            <div>
              <p className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Packages
              </p>
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => goToPackage(pkg)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-accent"
                >
                  <PackageSearch className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {pkg.package_name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatRupees(pkg.offer_price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}

export { SearchSuggestions };
