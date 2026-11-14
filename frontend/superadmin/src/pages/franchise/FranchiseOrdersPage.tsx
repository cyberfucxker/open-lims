import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import type { DataTableColumn } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFranchiseOrders } from "@/hooks/queries/useFranchise";
import { formatCurrency } from "@/lib/format";
import type { FranchiseOrderRow } from "@/services/api/franchiseApi";

import { FranchiseCreateOrderDialog } from "./FranchiseCreateOrderDialog";
import { FranchiseListShell } from "./FranchiseListShell";
import { FranchiseOrderDetailDrawer } from "./FranchiseOrderDetailDrawer";
import { ORDER_STATUS_BADGE, ORDER_STATUS_FILTERS } from "./orderStatus";
import { useDebouncedSearch } from "./useDebouncedSearch";
import { BookingDate } from "@/components/common/BookingDate";

const PAGE_SIZE = 10;

const columns: DataTableColumn<FranchiseOrderRow>[] = [
  {
    key: "orderNumber",
    header: "Order",
    render: (row) => (
      <span className="font-mono text-xs tracking-wider text-foreground">{row.orderNumber}</span>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    render: (row) => (
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">{row.customerName ?? "—"}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{row.customerMobile}</span>
      </div>
    ),
  },
  {
    key: "items",
    header: "Items",
    render: (row) => (
      <span className="block max-w-[280px] truncate text-sm text-muted-foreground">
        {row.itemSummary || "—"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => {
      const badge = ORDER_STATUS_BADGE[row.status] ?? {
        label: row.status,
        variant: "outline" as const,
      };
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
    },
  },
  {
    key: "payment",
    header: "Payment",
    render: (row) => (
      <div className="flex flex-col leading-tight">
        <span className="text-sm text-foreground">{row.paymentStatus ?? "—"}</span>
        <span className="text-xs text-muted-foreground">{row.paymentMode ?? "—"}</span>
      </div>
    ),
  },
  {
    key: "orderDate",
    header: "Booking Date",
    render: (row) => <BookingDate value={row.orderDate} className="text-sm text-foreground" />,
  },
  {
    key: "totalPayable",
    header: "Amount",
    className: "text-right",
    render: (row) => (
      <span className="font-semibold tabular-nums">{formatCurrency(row.totalPayable)}</span>
    ),
  },
];

function FranchiseOrdersPage() {
  const search = useDebouncedSearch();
  const [status, setStatus] = useState("all");
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    search.setPage(1);
    // Changing the status filter must reset paging for the same reason a new
    // search term does — page 4 of the old result set is meaningless here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const query = useFranchiseOrders({
    search: search.value || undefined,
    status: status === "all" ? undefined : status,
    page: search.page,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <FranchiseListShell
        title="Orders"
        description="Every order placed through your franchise."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Create Order
          </Button>
        }
        searchValue={search.input}
        onSearchChange={search.setInput}
        searchPlaceholder="Search by order number, customer name or mobile..."
        filters={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onReset={() => {
          search.reset();
          setStatus("all");
        }}
        columns={columns}
        rows={query.data?.rows ?? []}
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          setViewOrderId(row.id);
          setDetailOpen(true);
        }}
        isLoading={query.isLoading}
        error={query.isError ? query.error : null}
        onRetry={() => void query.refetch()}
        page={search.page}
        pageSize={PAGE_SIZE}
        total={query.data?.total ?? 0}
        onPageChange={search.setPage}
        emptyTitle="No orders found"
        emptyDescription="Orders placed through your franchise will appear here."
      />
      <FranchiseOrderDetailDrawer
        orderId={viewOrderId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <FranchiseCreateOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

export { FranchiseOrdersPage };
