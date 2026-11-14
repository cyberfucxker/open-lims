import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, FlaskConical, Package, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SidePanel } from "@/components/common/SidePanel";
import { useCreateAppOrder } from "@/hooks/queries/useAppOrders";
import { formatCurrency } from "@/lib/format";
import { httpClient } from "@/services/api/httpClient";
import {
  fetchAppUserForOrder,
  searchAppUsersForOrder,
  type AppOrderPaymentMode,
  type AppUserAddress,
  type AppUserSearchResult,
} from "@/services/api/appOrderApi";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";
import { cn } from "@/utils/cn";

const PAYMENT_MODES: AppOrderPaymentMode[] = ["CASH", "ONLINE"];

/** A shared "test or package" row for the catalog picker below. Fetched live from the real
 * /tests and /packages master-data endpoints — kept local to this dialog rather than importing
 * anything from src/pages/tests-packages/**. */
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

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AppUserSearchResult | null>(null);
  const [addressId, setAddressId] = useState<string>("");
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<CatalogItem[]>([]);
  const [orderDate, setOrderDate] = useState("");
  const [paymentMode, setPaymentMode] = useState<AppOrderPaymentMode>("ONLINE");

  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 300);
  const debouncedItemSearch = useDebouncedValue(itemSearch, 300);

  const createOrder = useCreateAppOrder();

  useEffect(() => {
    if (!open) return;
    setCustomerSearch("");
    setSelectedCustomer(null);
    setAddressId("");
    setSelectedItems([]);
    setOrderDate("");
    setPaymentMode("ONLINE");
    setItemSearch("");
  }, [open]);

  const customerResultsQuery = useQuery({
    queryKey: ["app-users-search-for-order", debouncedCustomerSearch],
    queryFn: () => searchAppUsersForOrder(debouncedCustomerSearch),
    enabled: open && debouncedCustomerSearch.trim().length > 0,
  });

  const customerDetailQuery = useQuery({
    queryKey: ["app-user-detail-for-order", selectedCustomer?.id],
    queryFn: () => fetchAppUserForOrder(selectedCustomer!.id),
    enabled: Boolean(selectedCustomer),
  });

  useEffect(() => {
    if (!customerDetailQuery.data) return;
    const addresses = customerDetailQuery.data.addresses;
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    setAddressId(defaultAddr?.id ?? "");
  }, [customerDetailQuery.data]);

  const catalogQuery = useQuery({
    queryKey: ["order-catalog", debouncedItemSearch],
    queryFn: () => fetchCatalog(debouncedItemSearch),
    enabled: open,
  });

  const catalog = catalogQuery.data ?? [];
  const addresses: AppUserAddress[] = customerDetailQuery.data?.addresses ?? [];

  const amount = selectedItems.reduce((s, i) => s + i.price, 0);

  function toggleItem(item: CatalogItem) {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item],
    );
  }

  function handleSubmit() {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (!addressId) {
      toast.error("Please select a service address");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Select at least one test or package");
      return;
    }
    if (!orderDate) {
      toast.error("Please choose an order date");
      return;
    }

    const testIds = selectedItems.filter((i) => i.type === "test").map((i) => i.id);
    const packageIds = selectedItems.filter((i) => i.type === "package").map((i) => i.id);

    createOrder.mutate(
      {
        appUserId: selectedCustomer.id,
        addressId,
        orderDate,
        testIds,
        packageIds: packageIds.length > 0 ? packageIds : undefined,
        paymentMode,
      },
      {
        onSuccess: (created) => {
          toast.success(`Order ${created.orderNumber} created successfully`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to create order");
        },
      },
    );
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Order"
      description="Fill in the details to book a new order on behalf of a patient app customer."
      widthClassName="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending ? "Creating…" : "Create Order"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Customer
          </Label>
          <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {selectedCustomer
                    ? `${selectedCustomer.name} — ${selectedCustomer.mobile}`
                    : "Search customer by name or phone…"}
                </span>
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  value={customerSearch}
                  onValueChange={setCustomerSearch}
                  placeholder="Search name or phone…"
                />
                <CommandList>
                  {customerSearch.trim().length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Start typing a name or phone number…
                    </p>
                  ) : customerResultsQuery.isFetching ? (
                    <div className="flex flex-col gap-2 p-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {(customerResultsQuery.data ?? []).map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              setSelectedCustomer(c);
                              setCustomerPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "size-4",
                                selectedCustomer?.id === c.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col leading-tight">
                              <span>{c.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.mobile} {c.cityName ? `• ${c.cityName}` : ""}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </section>

        <section className="flex flex-col gap-1.5">
          <Label>Service Address</Label>
          {!selectedCustomer ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
              Select a customer to choose one of their saved addresses.
            </p>
          ) : customerDetailQuery.isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : addresses.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
              This customer has no saved addresses yet.
            </p>
          ) : (
            <Select value={addressId} onValueChange={setAddressId}>
              <SelectTrigger>
                <SelectValue placeholder="Select address" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {[a.houseNo, a.apartment, a.address, a.landmark, a.city]
                      .filter(Boolean)
                      .join(", ")}
                    {a.isDefault ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Tests & Packages
          </Label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search tests or packages…"
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-56 rounded-xl border border-border">
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
                  className="gap-1"
                >
                  {item.shortName}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-date">Order Date</Label>
            <Input
              id="order-date"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Payment Mode</Label>
            <Select
              value={paymentMode}
              onValueChange={(v) => setPaymentMode(v as AppOrderPaymentMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="flex flex-col gap-1.5 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Total Payable ({selectedItems.length} items)</span>
            <span className="tabular-nums">{formatCurrency(amount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Phlebotomy charges, wallet credit, and coupon discounts (if any) are calculated by the
            system after checkout — not part of manual admin order creation.
          </p>
        </section>
      </div>
    </SidePanel>
  );
}

export { CreateOrderDialog };
