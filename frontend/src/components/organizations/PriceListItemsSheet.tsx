import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePriceListItems, useSetPriceListItems } from "@/hooks/queries/usePriceLists";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { PriceList } from "@/types/priceList";

interface PriceListItemsSheetProps {
  priceList: PriceList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PriceListItemsSheet({ priceList, open, onOpenChange }: PriceListItemsSheetProps) {
  const { data: items, isLoading } = usePriceListItems(open ? priceList?.id : undefined);
  const setItems = useSetPriceListItems();

  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && items) {
      setOverrides(
        Object.fromEntries(
          items
            .filter((item) => item.overridePrice !== null)
            .map((item) => [item.testId, String(item.overridePrice)]),
        ),
      );
    }
    if (!open) {
      setSearch("");
    }
  }, [open, items]);

  const filteredItems = items?.filter(
    (item) =>
      item.testName.toLowerCase().includes(search.toLowerCase()) ||
      item.departmentName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    if (!priceList) return;
    try {
      await setItems.mutateAsync({
        id: priceList.id,
        items: Object.entries(overrides)
          .filter(([, price]) => price !== "")
          .map(([testId, price]) => ({ testId, price: Number(price) })),
      });
      toast.success("Price list updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to update price list");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-xl">
        {priceList && (
          <>
            <SheetHeader>
              <SheetTitle>{priceList.name} — Test Prices</SheetTitle>
              <p className="text-xs text-muted-foreground">
                Leave a test blank to use the standard catalogue price.
              </p>
            </SheetHeader>

            <div className="border-b border-border px-6 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tests…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading tests…</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {filteredItems?.map((item) => (
                    <div
                      key={item.testId}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.testName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.departmentName} · Catalogue ₹{item.catalogPrice}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        placeholder={String(item.catalogPrice)}
                        className="w-28 shrink-0"
                        value={overrides[item.testId] ?? ""}
                        onChange={(e) =>
                          setOverrides((prev) => ({ ...prev, [item.testId]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  {filteredItems?.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No tests match your search.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={setItems.isPending}>
                {setItems.isPending ? "Saving…" : "Save Prices"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { PriceListItemsSheet };
