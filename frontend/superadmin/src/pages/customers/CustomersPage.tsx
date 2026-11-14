import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Eye,
  MessageCircle,
  MoreHorizontal,
  RotateCcw,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { AvatarChip } from "@/components/common/AvatarChip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PlatformBadge } from "@/components/common/PlatformBadge";
import { StatCard } from "@/components/common/StatCard";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppUsers, useSetAppUserStatus } from "@/hooks/queries/useAppUsers";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { AppUserListRow } from "@/services/api/appUserApi";

type ActiveFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 10;

function firstDayOfThisMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

function CustomersPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [blockTarget, setBlockTarget] = useState<AppUserListRow | null>(null);

  // Debounce free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [search, activeFilter, dateFrom, dateTo]);

  const isActiveParam = activeFilter === "all" ? undefined : activeFilter === "active";

  const listQuery = useAppUsers({
    search: search || undefined,
    isActive: isActiveParam,
    registeredFrom: dateFrom || undefined,
    registeredTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  // Real aggregate counts, sourced from the same endpoint's `total` (which the
  // server computes over the full filtered set, not just the current page) —
  // there is no dedicated stats endpoint, so each card issues its own
  // minimal (pageSize: 1) query filtered to what it needs to count.
  const activeCountQuery = useAppUsers({ isActive: true, page: 1, pageSize: 1 });
  const inactiveCountQuery = useAppUsers({ isActive: false, page: 1, pageSize: 1 });
  const newThisMonthQuery = useAppUsers({
    registeredFrom: firstDayOfThisMonth(),
    page: 1,
    pageSize: 1,
  });

  const setStatus = useSetAppUserStatus();

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statsLoading =
    listQuery.isLoading ||
    activeCountQuery.isLoading ||
    inactiveCountQuery.isLoading ||
    newThisMonthQuery.isLoading;

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setActiveFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function handleWhatsApp(customer: AppUserListRow) {
    const digits = customer.mobile.replace(/\D/g, "");
    if (!digits) {
      toast.error("This customer has no valid mobile number on file.");
      return;
    }
    const number = digits.length === 10 ? `91${digits}` : digits;
    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
  }

  function handleBlockConfirm() {
    if (!blockTarget) return;
    const target = blockTarget;
    setStatus.mutate(
      { id: target.id, isActive: false },
      {
        onSuccess: () => toast.success(`${target.name} has been blocked.`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to block customer."),
      },
    );
    setBlockTarget(null);
  }

  const handleUnblock = useCallback(
    (customer: AppUserListRow) => {
      setStatus.mutate(
        { id: customer.id, isActive: true },
        {
          onSuccess: () => toast.success(`${customer.name} has been unblocked.`),
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Failed to unblock customer."),
        },
      );
    },
    [setStatus],
  );

  const columns: DataTableColumn<AppUserListRow>[] = useMemo(
    () =>
      [
        {
          key: "id",
          header: "ID",
          render: (row) => (
            <span className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}</span>
          ),
        },
        {
          key: "name",
          header: "Name",
          render: (row) => <AvatarChip name={row.name} subtitle={row.email ?? undefined} />,
        },
        {
          key: "city",
          header: "City",
          render: (row) => (
            <span className="text-sm text-muted-foreground">{row.cityName ?? "—"}</span>
          ),
        },
        {
          key: "orderCount",
          header: "Order Count",
          render: (row) => (
            <span className="font-medium tabular-nums">{formatNumber(row.orderCount)}</span>
          ),
        },
        {
          key: "wallet",
          header: "Wallet Balance",
          render: (row) => (
            <span className="font-medium tabular-nums">{formatCurrency(row.walletBalance)}</span>
          ),
        },
        {
          key: "phone",
          header: "Phone Number",
          render: (row) => <span className="tabular-nums">{row.mobile}</span>,
        },
        {
          key: "platform",
          header: "Platform",
          render: (row) => <PlatformBadge platform={row.platform} />,
        },
        {
          key: "status",
          header: "Status",
          render: (row) =>
            row.isActive ? (
              <StatusPill status="active" />
            ) : (
              <StatusPill status="inactive" className="bg-destructive/10 text-destructive" />
            ),
        },
        {
          key: "actions",
          header: "",
          headerClassName: "w-10",
          className: "text-right",
          render: (row) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => navigate(`/customers/${row.id}`)}>
                  <Eye /> View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleWhatsApp(row)}>
                  <MessageCircle /> View on WhatsApp
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {row.isActive ? (
                  <DropdownMenuItem variant="destructive" onClick={() => setBlockTarget(row)}>
                    <Ban /> Block Customer
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleUnblock(row)}>
                    <CheckCircle2 /> Unblock Customer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ] satisfies DataTableColumn<AppUserListRow>[],
    [navigate, handleUnblock],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Customer Management"
        description="Search, filter, and manage all patient app customers."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Customers"
              value={formatNumber(total)}
              icon={Users}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Active Customers"
              value={formatNumber(activeCountQuery.data?.total ?? 0)}
              icon={UserCheck}
              gradient="bg-emerald-500"
              index={1}
            />
            <StatCard
              title="New This Month"
              value={formatNumber(newThisMonthQuery.data?.total ?? 0)}
              icon={UserPlus}
              gradient="bg-sky-500"
              index={2}
            />
            <StatCard
              title="Blocked Customers"
              value={formatNumber(inactiveCountQuery.data?.total ?? 0)}
              icon={Wallet}
              gradient="bg-violet-500"
              index={3}
            />
          </>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="min-w-[220px] flex-1"
            />
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                Registered From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {formatNumber(rows.length)} of {formatNumber(total)} customers
            </span>
          </div>
        </CardContent>
      </Card>

      {listQuery.isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "Failed to load customers."}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => listQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : listQuery.isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            pageSize={PAGE_SIZE}
            emptyTitle="No customers found"
            emptyDescription="Try adjusting your search or filters."
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 px-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={blockTarget !== null}
        onOpenChange={(open) => !open && setBlockTarget(null)}
        title="Block this customer?"
        description={`${blockTarget?.name ?? "This customer"} will no longer be able to log in or place new orders on the patient app.`}
        confirmLabel="Block Customer"
        destructive
        onConfirm={handleBlockConfirm}
      />
    </div>
  );
}

export { CustomersPage };
