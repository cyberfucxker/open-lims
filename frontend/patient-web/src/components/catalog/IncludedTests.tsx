import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

import { ParameterList } from "@/components/catalog/ParameterList";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useCityStore } from "@/store/cityStore";
import { cn } from "@/utils/cn";
import { buildCatalogItemPath } from "@/utils/routes";
import type { CatalogParameterDetail, PackageTestDetail } from "@/types";

/** Member tests shown before "View all tests" — enough to show what kind of
 *  package this is without the list becoming the page. */
const TESTS_BEFORE_FOLD = 4;

interface IncludedTestsProps {
  tests: PackageTestDetail[];
  /** Analytes the package sells directly, under no member test. Shown as a
   *  final group so a per-test grouping doesn't silently drop them. */
  standaloneParameters: CatalogParameterDetail[];
  /** Distinct analyte count across the whole package — the header's number.
   *  Comes from `PackageDetail.parameters`, not the sum of the per-test
   *  lists, which double-counts anything two member tests share. */
  totalParameters: number;
}

/** "What's included" on a package page: the member tests, each opening to
 *  reveal its own analytes.
 *
 *  Replaces two stacked lists — every member test, then all 44 analytes in
 *  one flat block — that between them filled several screens on arrival and
 *  never said which analyte came from which test. Now nothing is open to
 *  begin with: you see the tests, open the one you care about, and the
 *  analytes that appear are that test's. */
function IncludedTests({ tests, standaloneParameters, totalParameters }: IncludedTestsProps) {
  const citySlug = useCityStore((s) => s.city?.slug);
  const reduceMotion = usePrefersReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAllTests, setShowAllTests] = useState(false);

  const visibleTests = showAllTests ? tests : tests.slice(0, TESTS_BEFORE_FOLD);
  const hiddenTestCount = tests.length - visibleTests.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <FlaskConical className="size-4 text-primary" />
          What&apos;s included
        </h2>
        <span className="text-xs text-muted-foreground">
          {tests.length} {tests.length === 1 ? "test" : "tests"} · {totalParameters} parameters
        </span>
      </div>

      <ul className="space-y-2">
        {visibleTests.map((test) => {
          const isOpen = openId === test.id;
          const detailPath = buildCatalogItemPath({
            kind: "tests",
            id: test.id,
            slug: test.slug,
            citySlug,
            isParameter: test.isParameter,
          });

          return (
            <li
              key={test.id}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen ? "border-primary/40 bg-primary/[0.03]" : "border-border bg-card",
              )}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : test.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-primary/[0.04]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {test.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{test.shortName}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                  {test.parameters.length}{" "}
                  {test.parameters.length === 1 ? "parameter" : "parameters"}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180 text-primary",
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 border-t border-border/70 px-3 py-3">
                      {test.parameters.length > 0 ? (
                        // Already behind a tap, and a single test's list is
                        // short — no second fold inside the first.
                        <ParameterList parameters={test.parameters} />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Individual parameters aren&apos;t listed for this test.
                        </p>
                      )}

                      <Link
                        to={detailPath}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        Open {test.name}
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {hiddenTestCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAllTests(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/[0.05]"
        >
          View all {tests.length} tests
          <ChevronDown className="size-4" />
        </button>
      )}

      {standaloneParameters.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-medium text-foreground">
            Also included
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {standaloneParameters.length}{" "}
              {standaloneParameters.length === 1 ? "parameter" : "parameters"}
            </span>
          </p>
          <ParameterList parameters={standaloneParameters} initialCount={6} />
        </div>
      )}
    </div>
  );
}

export { IncludedTests };
