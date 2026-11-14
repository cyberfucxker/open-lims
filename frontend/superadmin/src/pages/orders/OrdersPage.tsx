import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Ban,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { AvatarChip } from "@/components/common/AvatarChip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { PlatformBadge } from "@/components/common/PlatformBadge";
import { StatCard } from "@/components/common/StatCard";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppOrders, useDeleteAppOrder } from "@/hooks/queries/useAppOrders";
import { usePhlebotomists } from "@/hooks/queries/usePhlebotomists";
import { formatNumber, formatTimeRange12h } from "@/lib/format";
import type { AppOrderListItem, AppOrderStatus } from "@/services/api/appOrderApi";
import { cn } from "@/utils/cn";

import { AssignPhleboMenu } from "./AssignPhleboMenu";
import { CreateOrderDialog } from "./CreateOrderDialog";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { BookingDate } from "@/components/common/BookingDate";
import { isManager } from "@/config/staffModules";
import { useAuth } from "@/hooks/useAuth";

const STATUS_OPTIONS: AppOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

const PAGE_SIZE = 10;

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  );
}

function OrdersPage() {
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [phleboFilter, setPhleboFilter] = useState<string>(() => {
    if (searchParams.get("filter") === "unassigned") return "unassigned";
    // Deep link from a Phlebotomist Profile's "View all orders" button.
    return searchParams.get("phleboId") ?? "all";
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppOrderListItem | null>(null);

  // Reset to page 1 whenever a filter changes so we never land on a now-empty page.
  const filterSignature = JSON.stringify({ search, statusFilter, phleboFilter, dateFrom, dateTo });
  const prevSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevSignature.current !== filterSignature) {
      prevSignature.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature]);

  const { data: phlebos = [] } = usePhlebotomists();

  const listParams = {
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : (statusFilter as AppOrderStatus),
    phleboId: phleboFilter === "all" ? undefined : phleboFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const ordersQuery = useAppOrders(listParams);

  // Cross-dataset counters (independent of the current filters) — each reuses the same list
  // endpoint with pageSize:1 purely to read its `total`, since there's no dedicated stats
  // endpoint for Orders.
  const totalQuery = useAppOrders({ page: 1, pageSize: 1 });
  const unassignedQuery = useAppOrders({ phleboId: "unassigned", page: 1, pageSize: 1 });
  const cancelledQuery = useAppOrders({ status: "CANCELLED", page: 1, pageSize: 1 });

  const rows = ordersQuery.data?.rows ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const deleteOrder = useDeleteAppOrder();
  const managerSession = isManager(useAuth().user);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPhleboFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteOrder.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Order ${deleteTarget.orderNumber} deleted`);
        setDeleteTarget(null);
      },
      onError: (error) => {
        // Real endpoint 400s with a specific message when the order has linked appointments —
        // surface it verbatim instead of a generic failure toast.
        toast.error(error instanceof Error ? error.message : "Failed to delete order");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<AppOrderListItem>[] = [
    {
      key: "id",
      header: "Order ID",
      render: (o) => (
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-foreground">{o.orderNumber}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(o.createdAt).toLocaleDateString("en-IN")}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer Name",
      render: (o) => <AvatarChip name={o.customerName} subtitle={o.customerMobile} />,
    },
    {
      key: "platform",
      header: "Platform",
      render: (o) => <PlatformBadge platform={o.platform} />,
    },
    {
      key: "city",
      header: "City",
      render: (o) => <span className="text-sm text-foreground">{o.city}</span>,
    },
    {
      key: "items",
      header: "Items",
      className: "max-w-[240px]",
      render: (o) => (
        <span
          className="block max-w-[220px] truncate text-sm text-muted-foreground"
          title={o.itemSummary}
        >
          {o.itemSummary}
        </span>
      ),
    },
    {
      key: "phlebo",
      header: "Assigned Phlebo",
      render: (o) => <AssignPhleboMenu order={o} />,
    },
    {
      key: "slot",
      header: "Booking Slot",
      // `slotLabel` arrives as 24-hour "HH:mm - HH:mm" (see
      // `appOrder.repository.ts`); ops read it in 12-hour clock time.
      render: (o) => (
        <div className="flex flex-col gap-0.5 text-sm">
          <BookingDate value={o.orderDate} className="font-medium text-foreground" />
          <span className="text-xs text-muted-foreground">
            {o.slotLabel ? formatTimeRange12h(o.slotLabel) : "Not scheduled"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Order Status",
      render: (o) => <StatusPill status={o.status.toLowerCase()} />,
    },
    {
      key: "payment",
      header: "Payment",
      render: (o) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={o.paymentMode.toLowerCase()} />
          {o.paymentStatus && (
            <span className="text-xs text-muted-foreground capitalize">
              {o.paymentStatus.toLowerCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (o) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="View Details"
            onClick={(e) => {
              e.stopPropagation();
              setViewOrderId(o.id);
              setDetailOpen(true);
            }}
          >
            <Eye className="size-4" />
          </Button>
          {/* Deleting stays ADMIN-only (the API refuses a manager too). */}
          {!managerSession && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Delete Order"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(o);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Order Management"
        description="Track, assign and manage every patient app booking in one place."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Create Order
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {totalQuery.isLoading ? (
          <StatSkeleton />
        ) : (
          <StatCard
            title="Total Orders"
            value={formatNumber(totalQuery.data?.total ?? 0)}
            icon={Package}
            gradient="bg-primary"
            index={0}
          />
        )}
        {unassignedQuery.isLoading ? (
          <StatSkeleton />
        ) : (
          <StatCard
            title="Unassigned"
            value={formatNumber(unassignedQuery.data?.total ?? 0)}
            icon={UserX}
            gradient="bg-orange-500"
            index={1}
            alert={(unassignedQuery.data?.total ?? 0) > 0}
          />
        )}
        {cancelledQuery.isLoading ? (
          <StatSkeleton />
        ) : (
          <StatCard
            title="Cancelled"
            value={formatNumber(cancelledQuery.data?.total ?? 0)}
            icon={Ban}
            gradient="bg-rose-500"
            index={2}
          />
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, order number or phone…"
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.toLowerCase().replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={phleboFilter} onValueChange={setPhleboFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phlebo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phlebos</SelectItem>
                <SelectItem value="unassigned">Unassigned Only</SelectItem>
                {phlebos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Order date</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {ordersQuery.isLoading ? (
        <Skeleton className="h-[420px] rounded-2xl" />
      ) : ordersQuery.isError ? (
        <EmptyState
          icon={Package}
          title="Couldn't load orders"
          description={
            ordersQuery.error instanceof Error ? ordersQuery.error.message : "Something went wrong"
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(o) => o.id}
            pageSize={Math.max(rows.length, 1)}
            rowClassName={(o) => cn(o.phlebotomist === null && "border-l-4 border-l-destructive")}
            emptyTitle="No orders match your filters"
            emptyDescription="Try adjusting the filters or search query above."
          />

          {rows.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(total, page * PAGE_SIZE)} of {total}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-16 text-center text-xs font-medium">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <OrderDetailDrawer orderId={viewOrderId} open={detailOpen} onOpenChange={setDetailOpen} />

      <CreateOrderDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this order?"
        description={
          deleteTarget
            ? `This will permanently remove order ${deleteTarget.orderNumber} for ${deleteTarget.customerName}. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Order"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export { OrdersPage };
