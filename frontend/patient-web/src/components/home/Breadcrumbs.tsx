import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import type { BreadcrumbItem } from "@/utils/seoJsonLd";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** Plain-text trail (e.g. "Home > Jaipur") — mainly an internal-linking and
 *  SEO signal (paired with the `BreadcrumbList` JSON-LD `HomePage.tsx`
 *  emits alongside it), not a primary nav control, so it's kept small and
 *  placed at the bottom of the page rather than up top. */
function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3" aria-hidden />}
              {isLast || !item.path ? (
                <span aria-current={isLast ? "page" : undefined} className="text-foreground/70">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="transition-colors hover:text-primary">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumbs };
