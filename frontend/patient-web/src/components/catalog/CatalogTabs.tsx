import { motion } from "framer-motion";

import { cn } from "@/utils/cn";

type CatalogTabKey = "tests" | "packages";

interface CatalogTab {
  key: CatalogTabKey;
  label: string;
}

interface CatalogTabsProps {
  value: CatalogTabKey;
  onChange: (value: CatalogTabKey) => void;
  className?: string;
}

const TABS: CatalogTab[] = [
  { key: "tests", label: "Tests" },
  { key: "packages", label: "Packages" },
];

/** Segmented Tests/Packages switcher for the Catalog page — a purpose-built
 *  sibling to `components/ui/tabs.tsx` (kept separate rather than extending
 *  it, so the shared shadcn Tabs used elsewhere in the app stays untouched).
 *  The active pill is a single `motion.span` with a shared `layoutId`, so
 *  framer-motion animates it sliding from one tab to the other instead of
 *  the plain background cross-fade the shadcn version does. */
function CatalogTabs({ value, onChange, className }: CatalogTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Browse by"
      className={cn("inline-flex w-full items-center gap-1 rounded-full bg-muted p-1", className)}
    >
      {TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className="relative h-9 flex-1 rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring"
          >
            {active && (
              <motion.span
                layoutId="catalog-tab-pill"
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                transition={{ type: "spring", damping: 30, stiffness: 340 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { CatalogTabs };
export type { CatalogTabKey };
