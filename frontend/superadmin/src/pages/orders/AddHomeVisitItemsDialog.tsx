import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Package, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SidePanel } from "@/components/common/SidePanel";
import { useAddHomeVisitItems } from "@/hooks/queries/useAppOrders";
import { formatCurrency } from "@/lib/format";
import { httpClient } from "@/services/api/httpClient";
import type { AppOrderDetail } from "@/services/api/appOrderApi";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";
import { cn } from "@/utils/cn";

// Same shape/fetch as CreateOrderDialog's own catalog picker — kept local to
// this dialog rather than shared, same convention that file's doc-comment
// already states.
interface CatalogItem {
  id: string;
  name: string;
  shortName: string;
  type: "test" | "package";
  price: number;
}
interface CatalogTestRow {
  id: string;
  name: string;
  shortName: string;
  price: number;
}
interface CatalogPackageRow {
  id: string;
  name: string;
  price: number;
}

async function fetchCatalog(search: string): Promise<CatalogItem[]> {
  const [testsRes, packagesRes] = await Promise.all([
    httpClient.get<ApiResponseBody<PaginatedResult<CatalogTestRow>>>("/tests", {
      params: { search: search || undefined, page: 1, pageSize: 25, status: "Active" },
      suppressErrorToast: true,
    }),
    httpClient.get<ApiResponseBody<PaginatedResult<CatalogPackageRow>>>("/packages", {
      params: { search: search || undefined, page: 1, pageSize: 25, active: true },
      suppressErrorToast: true,
    }),
  ]);
  const tests = (testsRes.data.data?.rows ?? []).map((t): CatalogItem => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    type: "test",
    price: t.price,
  }));
  const packages = (packagesRes.data.data?.rows ?? []).map((p): CatalogItem => ({
    id: p.id,
    name: p.name,
    shortName: p.name,
    type: "package",
    price: p.price,
  }));
  return [...tests, ...packages];
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

interface AddHomeVisitItemsDialogProps {
  order: AppOrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Lets an admin add tests/packages to a home-visit booking — the same
 *  action available from the phlebo app, exposed here too so ops can do it
 *  on the phlebo's behalf. Callable any number of times (see
 *  `OrderDetailDrawer.tsx`'s "Add Tests" button, shown next to the items list
 *  regardless of whether it's already got some) — each call only bills
 *  whatever wasn't already added. */
function AddHomeVisitItemsDialog({ order, open, onOpenChange }: AddHomeVisitItemsDialogProps) {
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<CatalogItem[]>([]);
  const debouncedItemSearch = useDebouncedValue(itemSearch, 300);
  const addItems = useAddHomeVisitItems();

  useEffect(() => {
    if (!open) return;
    setItemSearch("");
    setSelectedItems([]);
  }, [open]);

  const catalogQuery = useQuery({
    queryKey: ["home-visit-catalog", debouncedItemSearch],
    queryFn: () => fetchCatalog(debouncedItemSearch),
    enabled: open,
  });
  const catalog = catalogQuery.data ?? [];
  const amount = selectedItems.reduce((s, i) => s + i.price, 0);

  function toggleItem(item: CatalogItem) {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item],
    );
  }

  function handleSubmit() {
    if (selectedItems.length === 0) {
      toast.error("Select at least one test or package");
      return;
    }
    addItems.mutate(
      {
        orderId: order.id,
        body: {
          testIds: selectedItems.filter((i) => i.type === "test").map((i) => i.id),
          packageIds: selectedItems.filter((i) => i.type === "package").map((i) => i.id),
        },
      },
      {
        onSuccess: () => {
          toast.success(`Tests added to ${order.orderNumber}`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add tests");
        },
      },
    );
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Add Tests"
      description={`This visit was booked with a symptom, not a test list — pick what ${order.homeVisitFamilyMember?.name ?? "the patient"} should be tested for.`}
      widthClassName="sm:max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addItems.isPending}>
            {addItems.isPending ? "Adding…" : "Add Tests"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {order.symptomNotes && (
          <section className="rounded-xl border border-border bg-secondary/30 p-3">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Patient described
            </h3>
            <p className="text-sm text-foreground">{order.symptomNotes}</p>
          </section>
        )}

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder="Search tests or packages…"
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-64 rounded-xl border border-border">
          {catalogQuery.isLoading ? (
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
                      <Checkbox checked={checked} onCheckedChange={() => toggleItem(item)} />
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

        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedItems.map((item) => (
              <Badge
                key={`${item.type}-${item.id}`}
                variant={item.type === "package" ? "gradient" : "default"}
              >
                {item.shortName}
              </Badge>
            ))}
          </div>
        )}

        <section className="flex flex-col gap-1.5 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Test amount ({selectedItems.length} items)</span>
            <span className="tabular-nums">{formatCurrency(amount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Plus the {formatCurrency(order.phlebotomyCharges)} phlebotomy charge already fixed at
            booking — both are collected COD at the doorstep.
          </p>
        </section>
      </div>
    </SidePanel>
  );
}

export { AddHomeVisitItemsDialog };
