import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  IndianRupee,
  MoreVertical,
  Search,
  Undo2,
  Wallet,
} from "lucide-react";

import { AvatarChip } from "@/components/common/AvatarChip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusPill } from "@/components/common/StatusPill";
import { DonutChartCard } from "@/components/charts/DonutChartCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppOrders } from "@/hooks/queries/useAppOrders";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import type {
  AppOrderListItem,
  AppOrderPaymentMode,
  AppOrderPaymentStatus,
} from "@/services/api/appOrderApi";

import { RefundDialog } from "./RefundDialog";

const PAGE_SIZE = 10;

const MODE_OPTIONS: { value: AppOrderPaymentMode | "all"; label: string }[] = [
  { value: "all", label: "All Modes" },
  { value: "ONLINE", label: "Online" },
  { value: "CASH", label: "Cash on Delivery" },
];

const STATUS_OPTIONS: { value: NonNullable<AppOrderPaymentStatus> | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PENDING", label: "Pending" },
];

const MODE_CHART_COLORS: Record<AppOrderPaymentMode, string> = {
  ONLINE: "var(--chart-1)",
  CASH: "var(--chart-2)",
};

interface PendingRefund {
  payment: AppOrderListItem;
  amount: number;
  reason: string;
}

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

function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<AppOrderPaymentMode | "all">("all");
  const [statusFilter, setStatusFilter] = useState<NonNullable<AppOrderPaymentStatus> | "all">(
    "all",
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [refundTarget, setRefundTarget] = useState<AppOrderListItem | null>(null);
  const [pendingRefund, setPendingRefund] = useState<PendingRefund | null>(null);
  // No backend endpoint exists yet to actually process a refund on an order's
  // payment — this mirrors the previous mock behaviour of marking a payment
  // refunded in the UI only, without persisting anywhere real.
  const [locallyRefundedIds, setLocallyRefundedIds] = useState<Set<string>>(new Set());

  // Reset to page 1 whenever a filter changes so we never land on a now-empty page.
  const filterSignature = JSON.stringify({ search, modeFilter, statusFilter, dateFrom, dateTo });
  const prevSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevSignature.current !== filterSignature) {
      prevSignature.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature]);

  const listParams = {
    search: search.trim() || undefined,
    paymentMode: modeFilter,
    paymentStatus: statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const paymentsQuery = useAppOrders(listParams);

  // Cross-dataset counters (independent of the current filters) — each reuses the
  // same list endpoint with pageSize:1 purely to read its `total`, same convention
  // as Order Management's stat cards (no dedicated stats/aggregate endpoint exists).
  const totalQuery = useAppOrders({ page: 1, pageSize: 1 });
  const onlineQuery = useAppOrders({ paymentMode: "ONLINE", page: 1, pageSize: 1 });
  const cashQuery = useAppOrders({ paymentMode: "CASH", page: 1, pageSize: 1 });
  const pendingQuery = useAppOrders({ paymentStatus: "PENDING", page: 1, pageSize: 1 });

  const rows = paymentsQuery.data?.rows ?? [];
  const total = paymentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const modeBreakdown = [
    { name: "Online", value: onlineQuery.data?.total ?? 0, color: MODE_CHART_COLORS.ONLINE },
    { name: "Cash on Delivery", value: cashQuery.data?.total ?? 0, color: MODE_CHART_COLORS.CASH },
  ].filter((d) => d.value > 0);

  function resetFilters() {
    setSearch("");
    setModeFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function handleRefundSubmit(amount: number, reason: string) {
    if (!refundTarget) return;
    setPendingRefund({ payment: refundTarget, amount, reason });
    setRefundTarget(null);
  }

  function confirmRefund() {
    if (!pendingRefund) return;
    const { payment } = pendingRefund;
    setLocallyRefundedIds((prev) => new Set(prev).add(payment.id));
    toast.success(
      `Refund of ${formatCurrency(pendingRefund.amount)} processed for order ${payment.orderNumber}`,
    );
    setPendingRefund(null);
  }

  const columns: DataTableColumn<AppOrderListItem>[] = [
    {
      key: "orderNumber",
      header: "Order ID",
      render: (o) => <span className="font-medium text-foreground">{o.orderNumber}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => <AvatarChip name={o.customerName} subtitle={o.customerMobile} />,
    },
    {
      key: "totalPayable",
      header: "Amount",
      render: (o) => (
        <span className="font-medium tabular-nums text-foreground">
          {formatCurrency(o.totalPayable)}
        </span>
      ),
    },
    {
      key: "paymentMode",
      header: "Mode",
      render: (o) => <StatusPill status={o.paymentMode.toLowerCase()} />,
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (o) =>
        locallyRefundedIds.has(o.id) ? (
          <StatusPill status="refunded" />
        ) : (
          <StatusPill status={(o.paymentStatus ?? "pending").toLowerCase()} />
        ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (o) => <span className="whitespace-nowrap">{formatDateTime(o.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      render: (o) => {
        const canRefund =
          !locallyRefundedIds.has(o.id) &&
          (o.paymentStatus === "PAID" || o.paymentStatus === "PARTIAL");
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem disabled={!canRefund} onClick={() => setRefundTarget(o)}>
                <Undo2 className="size-4" />
                Manual Refund
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Payments & Transactions"
        description="Track collections and payment mode/status for every patient app order, and process manual refunds."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {totalQuery.isLoading ? (
          <StatSkeleton />
        ) : (
          <StatCard
            title="Total Payments"
            value={formatNumber(totalQuery.data?.total ?? 0)}
            icon={IndianRupee}
            gradient="bg-primary"
            index={0}
          />
        )}
        {onlineQuery.isLoading ? (
          <StatSkeleton />
        ) : (
          <StatCard
            title="Online Payments"
            value={formatNumber(onlineQuery.data?.total ?? 0)}
            icon={CreditCard}
            gradient="bg-brand-violet"
            index={1}
          />
        )}
        {cashQuery.isLoading ? (
          <StatSkeleton />
        ) : (
          <StatCard
            title="Cash on Delivery"
            value={formatNumber(cashQuery.data?.total ?? 0)}
            icon={Wallet}
            gradient="bg-warning"
            index={2}
          />
        )}
        {pendingQuery.isLoading ? (
          <StatSkeleton />
        ) : (
          <StatCard
            title="Pending Payments"
            value={formatNumber(pendingQuery.data?.total ?? 0)}
            icon={Ban}
            gradient="bg-destructive"
            index={3}
            alert={(pendingQuery.data?.total ?? 0) > 0}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 pt-6">
              <div className="flex min-w-52 flex-1 flex-col gap-1.5">
                <Label htmlFor="payments-search">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="payments-search"
                    placeholder="Customer, order number, or phone…"
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Mode</Label>
                <Select
                  value={modeFilter}
                  onValueChange={(v) => setModeFilter(v as AppOrderPaymentMode | "all")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as NonNullable<AppOrderPaymentStatus> | "all")
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date-from">From</Label>
                <Input
                  id="date-from"
                  type="date"
                  className="w-40"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date-to">To</Label>
                <Input
                  id="date-to"
                  type="date"
                  className="w-40"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              {(search || modeFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
                <Button variant="ghost" onClick={resetFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <DonutChartCard title="Payments by Mode" data={modeBreakdown} centerLabel="Payments" />
      </div>

      {paymentsQuery.isLoading ? (
        <Skeleton className="h-[420px] rounded-2xl" />
      ) : paymentsQuery.isError ? (
        <EmptyState
          icon={IndianRupee}
          title="Couldn't load payments"
          description={
            paymentsQuery.error instanceof Error
              ? paymentsQuery.error.message
              : "Something went wrong"
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(o) => o.id}
            pageSize={Math.max(rows.length, 1)}
            emptyTitle="No payments found"
            emptyDescription="Try adjusting your search or filters."
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

      <RefundDialog
        payment={
          refundTarget
            ? {
                orderNumber: refundTarget.orderNumber,
                customerName: refundTarget.customerName,
                amount: refundTarget.totalPayable,
              }
            : null
        }
        onOpenChange={(open) => !open && setRefundTarget(null)}
        onSubmit={handleRefundSubmit}
      />

      <ConfirmDialog
        open={pendingRefund != null}
        onOpenChange={(open) => !open && setPendingRefund(null)}
        title="Confirm manual refund"
        description={
          pendingRefund
            ? `Refund ${formatCurrency(pendingRefund.amount)} to ${pendingRefund.payment.customerName} for order ${pendingRefund.payment.orderNumber}. Reason: "${pendingRefund.reason}". This marks the payment as refunded in this view only — no gateway refund is triggered.`
            : ""
        }
        confirmLabel="Process Refund"
        destructive
        onConfirm={confirmRefund}
      />
    </div>
  );
}

export { PaymentsPage };
