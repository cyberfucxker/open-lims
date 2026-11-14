import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AlertTriangle, HandCoins, SlidersHorizontal } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { DataTable } from "@/components/common/DataTable";
import { DatePicker } from "@/components/common/DatePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReferralIncentives } from "@/hooks/queries/useReferralIncentives";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { IncentiveStatus, ReferralIncentive } from "@/types/referralIncentive";
import type { ReferralSource } from "@/types/referralSource";

const STATUS_OPTIONS: { value: "all" | IncentiveStatus; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "SETTLED", label: "Settled" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_LABEL: Record<IncentiveStatus, string> = {
  PENDING: "Pending",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE_VARIANT: Record<IncentiveStatus, "warning" | "success" | "secondary"> = {
  PENDING: "warning",
  SETTLED: "success",
  CANCELLED: "secondary",
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

async function fetchAllReferralSources(): Promise<ReferralSource[]> {
  const response = await httpClient.get<ApiResponseBody<ReferralSource[]>>("/referral-sources/all");
  return response.data.data as ReferralSource[];
}

function useAllReferralSources() {
  return useQuery({
    queryKey: ["referralSources", "all"],
    queryFn: fetchAllReferralSources,
  });
}

function ReferralIncentivesPage() {
  const [searchParams] = useSearchParams();

  const [referralSourceId, setReferralSourceId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"all" | IncentiveStatus>("all");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const fromUrl = searchParams.get("referralSourceId");
    if (fromUrl) {
      setReferralSourceId(fromUrl);
      setShowFilters(true);
    }
    // Only read on mount — deliberately not reactive to subsequent URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: referralSources } = useAllReferralSources();

  const referralOptions = useMemo(
    () =>
      (referralSources ?? []).map((source) => ({
        value: source.id,
        label: source.name,
        description: source.referralCode,
      })),
    [referralSources],
  );

  const params = {
    referralSourceId: referralSourceId || undefined,
    incentiveStatus: status === "all" ? undefined : status,
    dateFrom,
    dateTo,
    page: pageIndex + 1,
    pageSize,
  };

  const { data, isLoading, isFetching, isError, refetch } = useReferralIncentives(params);

  const hasActiveFilters = !!referralSourceId || status !== "all" || !!dateFrom || !!dateTo;

  const resetFilters = () => {
    setReferralSourceId(undefined);
    setStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPageIndex(0);
  };

  const columns = useMemo<ColumnDef<ReferralIncentive>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        meta: { label: "Patient" },
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{row.original.patientName}</span>
        ),
      },
      {
        accessorKey: "billNo",
        header: "Bill",
        meta: { label: "Bill" },
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.billNo}</span>
        ),
      },
      {
        accessorKey: "billAmount",
        header: "Revenue",
        meta: { label: "Revenue" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatCurrency(row.original.billAmount)}
          </span>
        ),
      },
      {
        accessorKey: "commissionPercentage",
        header: "Commission %",
        meta: { label: "Commission %" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.commissionPercentage}%
          </span>
        ),
      },
      {
        accessorKey: "incentiveAmount",
        header: "Incentive",
        meta: { label: "Incentive" },
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(row.original.incentiveAmount)}
          </span>
        ),
      },
      {
        accessorKey: "incentiveStatus",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_LABEL[row.original.incentiveStatus]}
            variant={STATUS_BADGE_VARIANT[row.original.incentiveStatus]}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Referral Incentives"
        description="Track commission earned per patient bill."
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="w-full max-w-xs">
                <SearchableSelect
                  options={referralOptions}
                  value={referralSourceId}
                  onChange={(value) => {
                    setReferralSourceId(value);
                    setPageIndex(0);
                  }}
                  placeholder="All referrals"
                  searchPlaceholder="Search referral…"
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as "all" | IncentiveStatus);
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <SlidersHorizontal className="size-3.5" /> More Filters
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-secondary/40 p-3 sm:grid-cols-2 lg:grid-cols-3">
                <DatePicker
                  value={dateFrom}
                  onChange={(v) => {
                    setDateFrom(v);
                    setPageIndex(0);
                  }}
                  placeholder="Date from"
                />
                <DatePicker
                  value={dateTo}
                  onChange={(v) => {
                    setDateTo(v);
                    setPageIndex(0);
                  }}
                  placeholder="Date to"
                />
                <Button variant="ghost" onClick={resetFilters}>
                  Reset filters
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        isLoading={isLoading || isFetching}
        totalRows={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        showColumnVisibility={false}
        emptyState={
          isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load incentives"
              description="Something went wrong while fetching referral incentives. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={HandCoins}
              title="No incentives found"
              description="They're created automatically when a bill is generated for a patient with a referral source."
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )
        }
      />
    </div>
  );
}

export { ReferralIncentivesPage };
