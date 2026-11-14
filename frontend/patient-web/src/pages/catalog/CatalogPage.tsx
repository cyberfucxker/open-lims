import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SearchX, SlidersHorizontal, X } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCards } from "@/components/common/SkeletonBlock";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { CatalogTabs, type CatalogTabKey } from "@/components/catalog/CatalogTabs";
import { CategoryChip } from "@/components/catalog/CategoryChip";
import { PackageCard } from "@/components/catalog/PackageCard";
import { SearchBar } from "@/components/catalog/SearchBar";
import { TestCard } from "@/components/catalog/TestCard";
import { catalogApi } from "@/services/api/catalogApi";
import { getHome } from "@/services/api/homeApi";
import { useCities } from "@/hooks/queries/useCities";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { useAdoptCityFromRoute } from "@/hooks/useAdoptCityFromRoute";
import { useSyncCityToRoute } from "@/hooks/useSyncCityToRoute";
import { useCityStore } from "@/store/cityStore";
import { buildCatalogPath } from "@/utils/routes";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 20;

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const panelVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 14 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -14 }),
};

const TAB_ORDER: CatalogTabKey[] = ["tests", "packages"];

interface CatalogPageProps {
  /** Present only when rendered via `TestsSegmentRoute`/`PackagesSegmentRoute`
   *  for the city-scoped landing url (`/tests/{citySlug}`) — resolved to a
   *  City below the same way `TestDetailPage`'s `citySlug` prices its detail
   *  view, independently of whatever's in `useCityStore`. */
  citySlug?: string;
}

function CatalogPage({ citySlug }: CatalogPageProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The URL itself is the source of truth for which tab is showing — "/tests"
  // or "/packages" (see routes/index.tsx), and `startsWith` rather than an
  // exact match so the city-scoped list url ("/tests/ajmer") still counts —
  // so a refresh, a shared link, or the browser back/forward button all land
  // on the right tab, not always back on "Tests".
  const tab: CatalogTabKey = location.pathname.startsWith("/packages") ? "packages" : "tests";
  const [direction, setDirection] = useState(1);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category"),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  // Debounced so paging through a search doesn't fire a request per
  // keystroke — same pattern `SelectCityDialog`'s city search uses.
  const debouncedQuery = useDebouncedValue(query, 400);

  // Prefill from Home's "?q=" / "?category=" links whenever the query params change.
  useEffect(() => {
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    if (q) setQuery(q);
    if (category) setSelectedCategory(category);
  }, [searchParams]);

  // Selected city scopes both which tests/packages appear and their price —
  // see `catalogApi.listTests/listPackages`'s `cityId` param. `selectedCategory`
  // (a Home tile's AppCategory id) narrows the list to that lifestyle/condition
  // group. Both are keyed into the query so switching either actually refetches
  // instead of showing stale data from whatever loaded first.
  //
  // A `citySlug` prop (the `/tests|packages/{citySlug}` landing url) takes
  // priority over the picker's own selection — same rule as
  // `TestDetailPage`'s slug-based fetch — and resolves against the same
  // `GET /master/cities` list `SelectCityDialog` uses, falling back to the
  // picker's city while that list is still loading or the slug doesn't
  // match anything (a mistyped/stale url degrades to the city-agnostic list
  // rather than an error page).
  const storeCity = useCityStore((s) => s.city);
  const { data: cities } = useCities();
  const resolvedCity = citySlug ? cities?.find((c) => c.slug === citySlug) : storeCity;
  const cityId = resolvedCity?.id;
  const activeCitySlug = citySlug ?? storeCity?.slug;

  // Keeps `/tests/{citySlug}` (no `itemSlug`) in sync when the patient
  // switches city via the picker while already sitting on this page — same
  // mechanism `TestDetailPage`/`PackageDetailPage` use for their own
  // city-slugged url. A no-op on the plain `/tests`/`/packages` tabs, where
  // `citySlug` is undefined.
  useSyncCityToRoute(tab, citySlug);

  // …and the other direction: arriving on `/tests/{citySlug}` adopts that
  // city as the selected one, so the location pill in the top nav agrees
  // with the list the patient is actually looking at (and stays agreeing
  // after they navigate away). No-op on the plain `/tests`/`/packages` tabs.
  useAdoptCityFromRoute(citySlug);

  // Resets to page 1 whenever anything that changes WHAT's being listed
  // changes — otherwise "page 5" from a previous search/city/category could
  // silently request a page past the end of a smaller result set.
  useEffect(() => {
    setPage(1);
  }, [tab, cityId, selectedCategory, debouncedQuery]);

  // 20 per page (see `catalog.service.ts#paginate`) — both queries run
  // unconditionally, not just the active tab's, so switching tabs is instant
  // instead of showing a loading skeleton every time.
  const testsQuery = useQuery({
    queryKey: ["tests", cityId ?? null, selectedCategory, debouncedQuery, page],
    queryFn: () => catalogApi.listTests(cityId, selectedCategory, page, PAGE_SIZE, debouncedQuery),
    placeholderData: (previous) => previous,
  });
  const packagesQuery = useQuery({
    queryKey: ["packages", cityId ?? null, selectedCategory, debouncedQuery, page],
    queryFn: () =>
      catalogApi.listPackages(cityId, selectedCategory, page, PAGE_SIZE, debouncedQuery),
    placeholderData: (previous) => previous,
  });
  const categoriesQuery = useQuery({ queryKey: ["home"], queryFn: () => getHome() });
  const selectedCategoryName = categoriesQuery.data?.categories.find(
    (c) => c.id === selectedCategory,
  )?.name;

  // City-slug mode gets a keyword-rich title/description/canonical, same
  // rule as `TestDetailPage`/`PackageDetailPage`'s own `useTestSeoMeta`; the
  // plain `/tests`/`/packages` tabs (no city picked yet) get a plainer,
  // city-agnostic version of the same copy.
  const cityName = resolvedCity?.name;
  const kindLabel = tab === "tests" ? "Lab Tests" : "Health Checkup Packages";
  useSeoMeta({
    title: cityName
      ? `${kindLabel} in ${cityName} — Book Online | Example Diagnostics Lab`
      : `${kindLabel} | Example Diagnostics Lab`,
    description: cityName
      ? `Browse and book ${tab === "tests" ? "diagnostic tests" : "health checkup packages"} in ${cityName} with free home sample collection and digital reports from Example Diagnostics Lab.`
      : `Browse and book diagnostic ${tab === "tests" ? "tests" : "packages"} online with free home sample collection and digital reports from Example Diagnostics Lab.`,
    canonicalPath: buildCatalogPath(tab, activeCitySlug),
  });

  function handleTabChange(next: CatalogTabKey) {
    if (next === tab) return;
    setDirection(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? 1 : -1);
    // `replace: true` — switching tabs isn't a new place to visit, it's the
    // same browsing session narrowing what it's looking at; a `q`/`category`
    // filter carries over via `location.search`, and the city segment (if
    // any) carries over too so switching tabs never drops back to the
    // city-agnostic url.
    navigate(
      { pathname: buildCatalogPath(next, activeCitySlug), search: location.search },
      { replace: true },
    );
  }

  // Filtering by `query` now happens server-side (see `catalogApi.listTests`'s
  // `search` param) — pagination means the client only ever holds one page's
  // worth of rows, so a client-side `.filter()` here would silently miss
  // every match sitting on a page that isn't loaded.
  const tests = testsQuery.data?.items ?? [];
  const packages = packagesQuery.data?.items ?? [];

  return (
    // Extra bottom padding leaves room for the FloatingCartBar so it never
    // covers the last row of cards once something is in the cart.
    <div className="mx-auto max-w-7xl pb-28">
      {/* Hero panel — replaces the plain `PageHeader` title bar other pages
          use. Two fixed static images (public/catalog-banner*.png), not the
          CMS "Banners & Offers" carousel — no admin/API dependency, so it's
          never empty and never changes on its own. Swap the files to change
          it.

          The box takes each artwork's OWN aspect ratio rather than a fixed
          height: mobile is 380x112, desktop 1248x112, and a fixed height on a
          box that stretches to the page width left the artwork stranded in the
          middle with empty card either side of it. Ratios are spelled out so
          the two must be updated together with the files — a new image at a
          different ratio needs its number changed here too.

          The artwork is full-bleed (it carries its own background), so it
          fills the box edge to edge: no padding, and no gradient/dot card
          behind it, both of which only existed to dress the gap a contained
          image left. `object-cover` with the matching ratio crops nothing.

          Two images, not one: the 4-item desktop row squeezed to fit a phone's
          ~360px width would shrink its text past legible, so phones get a
          simpler version instead of a smaller copy of the same image. */}
      <div className="px-4 pt-4">
        <div className="relative aspect-[380/88] w-full overflow-hidden rounded-2xl border border-border/60 shadow-sm sm:aspect-[1248/112]">
          <picture>
            <source media="(min-width: 640px)" srcSet="/catalog-banner.png" />
            <img
              src="/catalog-banner-mobile.png"
              alt="Lab tests, health packages, free home collection, digital reports"
              className="size-full object-cover object-[50%_20%] sm:object-center"
            />
          </picture>
        </div>
      </div>

      {/* The banner above is a static image, not text — without this the page
          had no h1 at all. Reuses the same kind/city copy `useSeoMeta` above
          already computes, so it stays in sync with the tab and the picked
          city without a second source of truth.
          `text-primary` (not the `--secondary` token) sets the city name apart
          — `--secondary` is a near-white background shade meant for button/
          badge fills, not standalone text, so it'd be almost invisible here. */}
      <h1 className="mt-3 px-4 text-center text-xl font-bold text-foreground sm:text-2xl">
        {cityName ? (
          <>
            {kindLabel} in <span className="text-primary">{cityName}</span>
          </>
        ) : (
          kindLabel
        )}
      </h1>

      <div className="sticky top-0 z-20 mt-3 space-y-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm md:top-[var(--top-nav-height)]">
        <div className="flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search tests, packages…"
            containerClassName="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>

        {selectedCategoryName && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {selectedCategoryName}
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                aria-label={`Clear ${selectedCategoryName} filter`}
                className="rounded-full p-0.5 hover:bg-primary/15"
              >
                <X className="size-3" />
              </button>
            </span>
          </div>
        )}

        <CatalogTabs value={tab} onChange={handleTabChange} />
      </div>

      <div className="px-4 pt-4">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={tab}
            custom={direction}
            variants={panelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          >
            {tab === "tests" ? (
              testsQuery.isLoading ? (
                <SkeletonCards
                  count={6}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                />
              ) : tests.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No results found"
                  description="Try a different search term or clear your filters."
                />
              ) : (
                <>
                  <motion.div
                    key={`tests-${debouncedQuery}-${page}`}
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {tests.map((test, i) => (
                      <TestCard key={test.id} test={test} index={i} />
                    ))}
                  </motion.div>
                  <CatalogPagination
                    page={page}
                    totalPages={testsQuery.data?.total_pages ?? 1}
                    onPageChange={setPage}
                  />
                </>
              )
            ) : packagesQuery.isLoading ? (
              <SkeletonCards
                count={6}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              />
            ) : packages.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No results found"
                description="Try a different search term or clear your filters."
              />
            ) : (
              <>
                <motion.div
                  key={`packages-${debouncedQuery}-${page}`}
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {packages.map((pkg, i) => (
                    <PackageCard key={pkg.id} pkg={pkg} index={i} />
                  ))}
                </motion.div>
                <CatalogPagination
                  page={page}
                  totalPages={packagesQuery.data?.total_pages ?? 1}
                  onPageChange={setPage}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slides in from the right rather than opening over the middle of the
          page. Filtering is a side task: the list you are filtering stays on
          screen beside the panel, so a chip's effect is visible as you tap
          it instead of only after dismissing a modal that covered it. */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-border px-5 py-4 pr-12">
            <SheetTitle>Filter by category</SheetTitle>
            <SheetDescription>
              Category highlights help you browse faster — search narrows the actual list.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {/* A list, not a chip grid: a 384px panel has room to print
                "Fever & Infection" in full, and the wrapped chips were
                clipping every name longer than about twelve characters. */}
            <ul className="space-y-2">
              {categoriesQuery.data?.categories.map((category) => (
                <li key={category.id}>
                  <CategoryChip
                    category={category}
                    size="row"
                    selected={selectedCategory === category.id}
                    onClick={() =>
                      setSelectedCategory((current) =>
                        current === category.id ? null : category.id,
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-4">
            {/* Only worth showing once there's something to clear — tapping
                the selected chip again already does it, but that isn't
                discoverable from looking at the panel. */}
            {selectedCategory && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedCategory(null)}
              >
                Clear
              </Button>
            )}
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FloatingCartBar />
    </div>
  );
}

export { CatalogPage };
