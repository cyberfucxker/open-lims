import { useMemo, useState } from "react";
import { FlaskConical, Package, Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useFranchisePriceList } from "@/hooks/queries/useFranchise";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/utils/cn";

export interface FranchiseCatalogItem {
  id: string;
  name: string;
  type: "test" | "package";
  price: number;
}

interface FranchiseCatalogPickerProps {
  selectedItems: FranchiseCatalogItem[];
  onToggle: (item: FranchiseCatalogItem) => void;
}

/** The test/package multi-select shared by the franchise's "Add Tests" and
 *  "Create Order" dialogs. Admin's equivalent (`AddHomeVisitItemsDialog`)
 *  searches `/tests`/`/packages` directly — those routes are ADMIN-only, so
 *  a franchise can't call them. This instead filters the franchise's own
 *  price list (`GET /franchise/price-list`, already fetched for the Price
 *  List page), client-side — the catalogue is small enough that a full
 *  fetch-once-then-filter is simpler than a second search endpoint, and it
 *  has the added benefit of only ever offering what this franchise actually
 *  sells, at the price it actually charges (its own overrides). */
function FranchiseCatalogPicker({ selectedItems, onToggle }: FranchiseCatalogPickerProps) {
  const [search, setSearch] = useState("");
  const { data: priceList, isLoading } = useFranchisePriceList();

  const catalog = useMemo<FranchiseCatalogItem[]>(() => {
    if (!priceList) return [];
    const tests = priceList.itemsByType.TEST.filter((t) => t.isOffered).map(
      (t): FranchiseCatalogItem => ({
        id: t.itemId,
        name: t.name,
        type: "test",
        price: t.effectivePrice,
      }),
    );
    const packages = priceList.itemsByType.PACKAGE.filter((p) => p.isOffered).map(
      (p): FranchiseCatalogItem => ({
        id: p.itemId,
        name: p.name,
        type: "package",
        price: p.effectivePrice,
      }),
    );
    const all = [...tests, ...packages];
    const q = search.trim().toLowerCase();
    return q ? all.filter((i) => i.name.toLowerCase().includes(q)) : all;
  }, [priceList, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests or packages…"
          className="pl-9"
        />
      </div>
      <ScrollArea className="h-64 rounded-xl border border-border">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {catalog.map((item) => {
              const checked = selectedItems.some((i) => i.id === item.id);
              return (
                <label
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent/50",
                    checked && "bg-primary/5",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Checkbox checked={checked} onCheckedChange={() => onToggle(item)} />
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md",
                        item.type === "package"
                          ? "bg-brand-violet/10 text-brand-violet"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {item.type === "package" ? (
                        <Package className="size-3.5" />
                      ) : (
                        <FlaskConical className="size-3.5" />
                      )}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="shrink-0 font-medium text-foreground tabular-nums">
                    {formatCurrency(item.price)}
                  </span>
                </label>
              );
            })}
            {catalog.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No tests or packages match your search.
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export { FranchiseCatalogPicker };
