import { useState } from "react";
import { ChevronDown, ChevronRight, Lock, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { useCityStore } from "@/store/cityStore";
import { cn } from "@/utils/cn";
import { buildCatalogItemPath } from "@/utils/routes";
import type { CatalogParameterDetail } from "@/types";

/** Renders a Test/Package's analyte list. A `bookable` parameter (its
 *  `doTest` flag) is highlighted — tinted with the brand primary — and, since
 *  it's independently sellable through its own auto-provisioned Test
 *  (`testId`/`testSlug`), the whole row is clickable straight through to that
 *  analyte's own detail page, so it can be added to cart on its own instead
 *  of only being labelled "Bookable" with no way to act on it. A non-bookable
 *  one stays a plain, disabled-looking "part of the test" row.
 *
 *  The link is the readable, city-priced `/parameter/{citySlug}/{testSlug}`
 *  whenever a city is picked (which it effectively always is — see
 *  `useDefaultCityBootstrap`), falling back to `/tests/{testId}` only when
 *  there's no city slug to build one with.
 *
 *  Long lists start collapsed. A full-body package runs to 44 analytes, and
 *  dumping all of them on arrival buried everything underneath — the price,
 *  the prep instructions, the CTA — under a wall of rows nobody reads top to
 *  bottom. `initialCount` shows enough to make the kind of thing obvious and
 *  leaves the rest behind a count you can act on. */
function ParameterList({
  parameters,
  initialCount,
}: {
  parameters: CatalogParameterDetail[];
  /** Rows shown before "View all". Omit to render every row outright — what
   *  a short, already-expanded per-test group wants. */
  initialCount?: number;
}) {
  const navigate = useNavigate();
  const citySlug = useCityStore((s) => s.city?.slug);
  const [expanded, setExpanded] = useState(false);

  if (parameters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No individual parameters are listed for this item.
      </p>
    );
  }

  const isTruncated = initialCount !== undefined && parameters.length > initialCount && !expanded;
  const visible = isTruncated ? parameters.slice(0, initialCount) : parameters;
  const hiddenCount = parameters.length - visible.length;

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map((p) => {
          const clickable = p.bookable && !!p.testId;
          const detailPath = p.testId
            ? buildCatalogItemPath({
                kind: "tests",
                id: p.testId,
                slug: p.testSlug,
                citySlug,
                isParameter: true,
              })
            : null;

          const rowClassName = cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
            p.bookable
              ? "border-primary/50 bg-primary/[0.06] text-foreground"
              : "border-border bg-muted/40 text-muted-foreground opacity-60",
            clickable && "hover:border-primary hover:bg-primary/[0.1]",
          );

          const row = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                {p.bookable ? (
                  <PlusCircle className="size-4 shrink-0 text-primary" />
                ) : (
                  <Lock className="size-3.5 shrink-0" />
                )}
                <span className={cn("truncate", p.bookable && "font-medium")}>{p.name}</span>
              </span>
              {clickable ? (
                <ChevronRight className="size-4 shrink-0 text-primary" />
              ) : p.bookable ? (
                <Badge variant="success" className="shrink-0">
                  Bookable
                </Badge>
              ) : (
                <span className="shrink-0 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  In test
                </span>
              )}
            </>
          );

          return (
            <li key={p.id}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => detailPath && navigate(detailPath)}
                  className={rowClassName}
                >
                  {row}
                </button>
              ) : (
                <div className={rowClassName}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>

      {(isTruncated || expanded) && initialCount !== undefined && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/[0.05]"
        >
          {expanded ? "Show less" : `View all ${parameters.length} parameters`}
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
      )}

      {isTruncated && <span className="sr-only">{hiddenCount} more parameters are hidden</span>}
    </div>
  );
}

export { ParameterList };
