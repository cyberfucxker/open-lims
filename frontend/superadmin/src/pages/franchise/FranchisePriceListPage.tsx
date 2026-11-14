import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RotateCcw, Save, Tag } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFranchisePriceList, useSaveFranchisePrices } from "@/hooks/queries/useFranchise";
import { formatCurrency } from "@/lib/format";
import type { FranchisePriceListItem, PriceListItemType } from "@/services/api/franchiseApi";
import { groupItemsForEditor } from "@/services/api/priceListApi";
import { cn } from "@/utils/cn";

const TABS: { value: PriceListItemType; label: string }[] = [
  { value: "TEST", label: "Tests" },
  { value: "PACKAGE", label: "Packages" },
  { value: "PARAMETER", label: "Parameters" },
];

const PAGE_SIZE = 50;

/** Draft edits keyed by `type:id` — a price string ("" means no override) plus
 *  whether the item is offered at all under this list. A key present means
 *  the operator touched this item; absent means "use the item's current
 *  values" (see `currentEntry`). */
interface DraftEntry {
  price: string;
  offered: boolean;
}
type Draft = Record<string, DraftEntry>;

function itemKey(item: Pick<FranchisePriceListItem, "itemType" | "itemId">) {
  return `${item.itemType}:${item.itemId}`;
}

function currentEntry(item: FranchisePriceListItem): DraftEntry {
  return {
    price: item.overridePrice === null ? "" : String(item.overridePrice),
    offered: item.isOffered,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function FranchisePriceListPage() {
  const [tab, setTab] = useState<PriceListItemType>("TEST");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft>({});
  const [page, setPage] = useState(0);

  const query = useFranchisePriceList();
  const saveMutation = useSaveFranchisePrices();

  const allItems = useMemo(() => {
    if (!query.data) return [];
    return [
      ...query.data.itemsByType.TEST,
      ...query.data.itemsByType.PACKAGE,
      ...query.data.itemsByType.PARAMETER,
    ];
  }, [query.data]);

  const itemsByTab = useMemo(
    () => (query.data ? groupItemsForEditor(query.data.itemsByType) : null),
    [query.data],
  );

  const visibleItems = useMemo(() => {
    const items = itemsByTab?.[tab] ?? [];
    const term = search.trim().toLowerCase();
    return term ? items.filter((i) => i.name.toLowerCase().includes(term)) : items;
  }, [itemsByTab, tab, search]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedItems = visibleItems.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const dirtyCount = useMemo(() => {
    return Object.entries(draft).filter(([key, value]) => {
      const item = allItems.find((i) => itemKey(i) === key);
      if (!item) return false;
      const current = currentEntry(item);
      return value.price !== current.price || value.offered !== current.offered;
    }).length;
  }, [draft, allItems]);

  function draftEntry(item: FranchisePriceListItem): DraftEntry {
    const key = itemKey(item);
    return key in draft ? draft[key] : currentEntry(item);
  }

  function setPrice(item: FranchisePriceListItem, value: string) {
    setDraft((prev) => ({ ...prev, [itemKey(item)]: { ...draftEntry(item), price: value } }));
  }

  function setOffered(item: FranchisePriceListItem, offered: boolean) {
    setDraft((prev) => ({ ...prev, [itemKey(item)]: { ...draftEntry(item), offered } }));
  }

  function displayValue(item: FranchisePriceListItem): string {
    return draftEntry(item).price;
  }

  function handleSave() {
    // Send the FULL override set, not just the dirty rows: the endpoint replaces
    // the list wholesale, so omitting untouched rows would delete them.
    const merged = new Map<string, { item: FranchisePriceListItem; entry: DraftEntry }>();
    for (const item of allItems) {
      merged.set(itemKey(item), { item, entry: draftEntry(item) });
    }

    const items: {
      itemType: PriceListItemType;
      itemId: string;
      price: number;
      isOffered: boolean;
    }[] = [];
    for (const { item, entry } of merged.values()) {
      const trimmed = entry.price.trim();
      // See PriceListPricingPage's twin comment: "not offered" still needs a
      // row (price is a required column) even with no price override.
      if (trimmed === "" && entry.offered) continue;

      const price = trimmed === "" ? item.catalogPrice : Number(trimmed);
      if (Number.isNaN(price) || price < 0) {
        toast.error(`"${item.name}" has an invalid price.`);
        return;
      }
      items.push({ itemType: item.itemType, itemId: item.itemId, price, isOffered: entry.offered });
    }

    saveMutation.mutate(items, {
      onSuccess: () => {
        toast.success("Prices updated.");
        setDraft({});
      },
      onError: (error) => toast.error(errorMessage(error, "Failed to save prices")),
    });
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Price List" description="Your franchise's own pricing." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {errorMessage(query.error, "Could not load your price list.")}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Your lab administrator assigns a price list when your franchise is set up. Once one is
              assigned, you will be able to adjust your own prices here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Price List"
        description={
          query.data
            ? `${query.data.name} — your own copy. Changes here affect only your franchise.`
            : "Your franchise's own pricing."
        }
        actions={
          <Button onClick={handleSave} disabled={dirtyCount === 0 || saveMutation.isPending}>
            <Save className="size-4" />
            {saveMutation.isPending
              ? "Saving…"
              : dirtyCount > 0
                ? `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`
                : "Save"}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/40 p-1">
            {TABS.map((t) => {
              const count = itemsByTab?.[t.value]?.length ?? 0;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setTab(t.value);
                    setPage(0);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    tab === t.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                  <span className="ml-1.5 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search this tab…"
            className="min-w-[220px] flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={dirtyCount === 0}
            onClick={() => setDraft({})}
          >
            <RotateCcw className="size-3.5" /> Discard changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {query.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Tag className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Nothing to price here</p>
              <p className="text-sm text-muted-foreground">
                {search ? "No item matches your search." : "This catalogue tab is empty."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-border pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                <span className="w-16">Offered</span>
                <span>Item</span>
                <span className="w-28 text-right">Catalogue</span>
                <span className="w-32 text-right">Your price</span>
                <span className="w-24 text-right">Effective</span>
              </div>

              {pagedItems.map((item) => {
                const value = displayValue(item);
                const offered = draftEntry(item).offered;
                const overridden = value.trim() !== "";
                const effective = overridden ? Number(value) : item.catalogPrice;
                return (
                  <div
                    key={itemKey(item)}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-border/60 py-2.5 last:border-0",
                      !offered && "opacity-50",
                    )}
                  >
                    <span className="flex w-16 items-center">
                      <Checkbox
                        checked={offered}
                        onCheckedChange={(checked) => setOffered(item, checked === true)}
                        aria-label={`${item.name} offered`}
                      />
                    </span>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </span>
                      {overridden && (
                        <Badge variant="info" className="shrink-0">
                          Custom
                        </Badge>
                      )}
                      {!offered && (
                        <Badge variant="secondary" className="shrink-0">
                          Not offered
                        </Badge>
                      )}
                    </div>
                    <span className="w-28 text-right text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(item.catalogPrice)}
                    </span>
                    <Input
                      value={value}
                      onChange={(e) => setPrice(item, e.target.value)}
                      placeholder="Catalogue"
                      inputMode="decimal"
                      disabled={!offered}
                      className="h-9 w-32 text-right tabular-nums"
                    />
                    <span
                      className={cn(
                        "w-24 text-right text-sm font-semibold tabular-nums",
                        overridden ? "text-primary" : "text-foreground",
                      )}
                    >
                      {Number.isNaN(effective) ? "—" : formatCurrency(effective)}
                    </span>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1 pt-4 text-sm text-muted-foreground">
                  <span>
                    Showing {currentPage * PAGE_SIZE + 1}-
                    {Math.min(visibleItems.length, (currentPage + 1) * PAGE_SIZE)} of{" "}
                    {visibleItems.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label="Previous page"
                      disabled={currentPage === 0}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="min-w-16 text-center text-xs font-medium">
                      Page {currentPage + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label="Next page"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Leave a price blank to fall back to the catalogue price. Your price list is a private copy —
        no other franchise can see or change it.
      </p>
    </div>
  );
}

export { FranchisePriceListPage };
