import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  IndianRupee,
  MoreVertical,
  RotateCcw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { AvatarChip } from "@/components/common/AvatarChip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
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
import { useAdjustWallet, useAppUsers, useWalletStats } from "@/hooks/queries/useAppUsers";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { AppUserListRow } from "@/services/api/appUserApi";

import { RechargeSlabsCard } from "./RechargeSlabsCard";
import { WalletAdjustDialog } from "./WalletAdjustDialog";
import { WalletLedgerPanel } from "./WalletLedgerPanel";

const PAGE_SIZE = 10;

interface PendingDebit {
  customer: AppUserListRow;
  amount: number;
  reason: string;
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

function WalletPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);
  const [adjustState, setAdjustState] = useState<{
    customerId: string;
    mode: "credit" | "debit";
  } | null>(null);
  const [pendingDebit, setPendingDebit] = useState<PendingDebit | null>(null);

  // Debounce free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [search, minBalance, maxBalance, sortDir]);

  const listQuery = useAppUsers({
    search: search || undefined,
    minBalance: minBalance ? Number(minBalance) : undefined,
    maxBalance: maxBalance ? Number(maxBalance) : undefined,
    sortBy: "walletBalance",
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  });
  const statsQuery = useWalletStats();
  const adjustMutation = useAdjustWallet();

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const adjustCustomer = adjustState
    ? (rows.find((c) => c.id === adjustState.customerId) ?? null)
    : null;

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setMinBalance("");
    setMaxBalance("");
    setSortDir("desc");
  }

  function handleAdjustSubmit(amount: number, reason: string) {
    if (!adjustState || !adjustCustomer) return;
    const label = adjustCustomer.name ?? adjustCustomer.mobile;

    if (adjustState.mode === "credit") {
      adjustMutation.mutate(
        { id: adjustState.customerId, input: { type: "CREDIT", amount, reason } },
        {
          onSuccess: () => toast.success(`${formatCurrency(amount)} credited to ${label}'s wallet`),
          onError: (error) =>
            toast.error(error instanceof Error ? error.message : "Failed to credit wallet"),
        },
      );
      setAdjustState(null);
    } else {
      setPendingDebit({ customer: adjustCustomer, amount, reason });
      setAdjustState(null);
    }
  }

  function confirmDebit() {
    if (!pendingDebit) return;
    const target = pendingDebit;
    const label = target.customer.name ?? target.customer.mobile;
    adjustMutation.mutate(
      {
        id: target.customer.id,
        input: { type: "DEBIT", amount: target.amount, reason: target.reason },
      },
      {
        onSuccess: () =>
          toast.success(`${formatCurrency(target.amount)} debited from ${label}'s wallet`),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Failed to debit wallet"),
      },
    );
    setPendingDebit(null);
  }

  const columns: DataTableColumn<AppUserListRow>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (c) => <AvatarChip name={c.name} subtitle={c.cityName ?? undefined} />,
    },
    { key: "phone", header: "Phone", render: (c) => c.mobile },
    {
      key: "balance",
      header: "Wallet Balance",
      render: (c) => (
        <span className="font-semibold tabular-nums text-foreground">
          {formatCurrency(c.walletBalance)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      render: (c) => (
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
            <DropdownMenuItem onClick={() => setLedgerCustomerId(c.id)}>
              View Ledger
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAdjustState({ customerId: c.id, mode: "credit" })}>
              Credit Wallet
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={c.walletBalance <= 0}
              onClick={() => setAdjustState({ customerId: c.id, mode: "debit" })}
            >
              Debit Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Wallet Management"
        description="Monitor customer wallet balances, review ledgers, and process manual credit/debit adjustments."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsQuery.isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Wallet Liability"
              value={formatCurrency(statsQuery.data?.totalLiability ?? 0)}
              icon={Wallet}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Customers with Balance"
              value={formatNumber(statsQuery.data?.customersWithBalance ?? 0)}
              icon={Users}
              gradient="bg-info"
              index={1}
            />
            <StatCard
              title="Avg Wallet Balance"
              value={formatCurrency(Math.round(statsQuery.data?.avgBalance ?? 0))}
              icon={IndianRupee}
              gradient="bg-brand-violet"
              index={2}
            />
            <StatCard
              title="Total Credits This Month"
              value={formatCurrency(statsQuery.data?.totalCreditsThisMonth ?? 0)}
              icon={TrendingUp}
              gradient="bg-success"
              index={3}
            />
          </>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex min-w-52 flex-1 flex-col gap-1.5">
            <Label htmlFor="wallet-search">Search</Label>
            <Input
              id="wallet-search"
              placeholder="Search by name or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="min-balance">Min Balance</Label>
            <Input
              id="min-balance"
              type="number"
              className="w-32"
              placeholder="0"
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max-balance">Max Balance</Label>
            <Input
              id="max-balance"
              type="number"
              className="w-32"
              placeholder="Any"
              value={maxBalance}
              onChange={(e) => setMaxBalance(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Sort by Balance</Label>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as "desc" | "asc")}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">High to Low</SelectItem>
                <SelectItem value="asc">Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchInput || minBalance || maxBalance || sortDir !== "desc") && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {listQuery.isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {listQuery.error instanceof Error ? listQuery.error.message : "Failed to load wallets."}
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
            rowKey={(c) => c.id}
            onRowClick={(c) => setLedgerCustomerId(c.id)}
            emptyTitle="No customers found"
            emptyDescription="Try adjusting your search or balance range filters."
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

      <RechargeSlabsCard />

      <WalletLedgerPanel
        appUserId={ledgerCustomerId}
        onOpenChange={(open) => !open && setLedgerCustomerId(null)}
      />

      <WalletAdjustDialog
        customer={adjustCustomer}
        mode={adjustState?.mode ?? "credit"}
        onOpenChange={(open) => !open && setAdjustState(null)}
        onSubmit={handleAdjustSubmit}
      />

      <ConfirmDialog
        open={pendingDebit != null}
        onOpenChange={(open) => !open && setPendingDebit(null)}
        title="Confirm wallet debit"
        description={
          pendingDebit
            ? `Debit ${formatCurrency(pendingDebit.amount)} from ${pendingDebit.customer.name ?? pendingDebit.customer.mobile}'s wallet. Reason: "${pendingDebit.reason}". This action cannot be undone.`
            : ""
        }
        confirmLabel="Debit Wallet"
        destructive
        onConfirm={confirmDebit}
      />
    </div>
  );
}

export { WalletPage };
