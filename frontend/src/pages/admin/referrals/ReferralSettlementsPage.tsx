import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  FileText,
  Receipt,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { DataTable } from "@/components/common/DataTable";
import { DatePicker } from "@/components/common/DatePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GenerateSettlementDialog } from "@/components/referrals/GenerateSettlementDialog";
import { ReferralSettlementDetailSheet } from "@/components/referrals/ReferralSettlementDetailSheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCancelSettlement,
  useMarkSettlementPaid,
  useReferralSettlement,
  useReferralSettlements,
} from "@/hooks/queries/useReferralSettlements";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { downloadBlob } from "@/services/api/billApi";
import { httpClient } from "@/services/api/httpClient";
import {
  fetchSettlementsExcelBlob,
  fetchSettlementsPdfBlob,
  fetchSingleSettlementPdfBlob,
} from "@/services/api/referralSettlement.api";
import type { ApiResponseBody } from "@/types/api";
import type { ReferralSource } from "@/types/referralSource";
import type { ReferralSettlement, SettlementStatus } from "@/types/referralSettlement";

const STATUS_LABEL: Record<SettlementStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function ReferralSettlementsPage() {
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | SettlementStatus>("all");
  const [referralSourceId, setReferralSourceId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateForId, setGenerateForId] = useState<string | undefined>(undefined);

  const [viewId, setViewId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const markPaid = useMarkSettlementPaid();
  const cancelSettlement = useCancelSettlement();

  useEffect(() => {
    const generateFor = searchParams.get("generateFor");
    if (generateFor) {
      setGenerateForId(generateFor);
      setGenerateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: referralSources } = useQuery({
    queryKey: ["referralSources", "all"],
    queryFn: async () => {
      const response = await httpClient.get<ApiResponseBody<ReferralSource[]>>(
        "/referral-sources/all",
        { suppressErrorToast: true },
      );
      return response.data.data as ReferralSource[];
    },
  });

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
    search: search || undefined,
    settlementStatus: status === "all" ? undefined : status,
    referralSourceId,
    dateFrom,
    dateTo,
    page: pageIndex + 1,
    pageSize,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? ("desc" as const) : ("asc" as const),
  };
  const { data, isLoading, isFetching, isError, refetch } = useReferralSettlements(params);

  const { data: viewSettlement } = useReferralSettlement(viewId ?? undefined);

  const openView = (id: string) => {
    setViewId(id);
    setDetailOpen(true);
  };

  const handleMarkPaid = async (settlement: ReferralSettlement) => {
    try {
      await markPaid.mutateAsync(settlement.id);
      toast.success(`Settlement for ${settlement.referralSourceName} marked as paid`);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError ? error.message : "Failed to mark settlement as paid",
      );
    }
  };

  const handleCancel = async (settlement: ReferralSettlement) => {
    try {
      await cancelSettlement.mutateAsync(settlement.id);
      toast.success(`Settlement for ${settlement.referralSourceName} cancelled`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to cancel settlement");
    }
  };

  const handleExportPdf = async (settlement: ReferralSettlement) => {
    try {
      const blob = await fetchSingleSettlementPdfBlob(settlement.id);
      downloadBlob(blob, `settlement-${settlement.id}.pdf`);
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await fetchSettlementsExcelBlob(params);
      downloadBlob(blob, "referral-settlements.xlsx");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handleExportPdfBulk = async () => {
    try {
      const blob = await fetchSettlementsPdfBlob(params);
      downloadBlob(blob, "referral-settlements.pdf");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setReferralSourceId(undefined);
    setStatus("all");
    setSearch("");
    setPageIndex(0);
  };

  const columns = useMemo<ColumnDef<ReferralSettlement>[]>(
    () => [
      {
        accessorKey: "referralSourceName",
        header: "Referral",
        meta: { label: "Referral" },
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {row.original.referralSourceName}
          </span>
        ),
      },
      {
        accessorKey: "totalPatients",
        header: "Patients",
        meta: { label: "Patients" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.totalPatients}</span>
        ),
      },
      {
        accessorKey: "totalRevenue",
        header: "Revenue",
        meta: { label: "Revenue" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatCurrency(row.original.totalRevenue)}
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
        accessorKey: "commissionAmount",
        header: "Commission Amount",
        meta: { label: "Commission Amount" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatCurrency(row.original.commissionAmount)}
          </span>
        ),
      },
      {
        accessorKey: "adjustment",
        header: "Adjustment",
        meta: { label: "Adjustment" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatCurrency(row.original.adjustment)}
          </span>
        ),
      },
      {
        accessorKey: "finalAmount",
        header: "Final Amount",
        meta: { label: "Final Amount" },
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(row.original.finalAmount)}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "settlementStatus",
        header: "Status",
        meta: { label: "Status" },
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={STATUS_LABEL[row.original.settlementStatus]} />,
      },
      {
        accessorKey: "paymentDate",
        header: "Payment Date",
        meta: { label: "Payment Date" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.paymentDate)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { label: "Actions" },
        cell: ({ row }) => {
          const settlement = row.original;
          const isPending = settlement.settlementStatus === "PENDING";
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openView(settlement.id)}>
                  <Eye className="size-4" /> View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportPdf(settlement)}>
                  <FileText className="size-4" /> Export PDF
                </DropdownMenuItem>
                {isPending && (
                  <ConfirmDialog
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <CheckCircle2 className="size-4" /> Mark Paid
                      </DropdownMenuItem>
                    }
                    title="Mark this settlement as paid?"
                    description={`The settlement for ${settlement.referralSourceName} will be marked as paid.`}
                    confirmLabel="Mark Paid"
                    onConfirm={() => handleMarkPaid(settlement)}
                  />
                )}
                {isPending && (
                  <ConfirmDialog
                    trigger={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <XCircle className="size-4" /> Cancel
                      </DropdownMenuItem>
                    }
                    title="Cancel this settlement?"
                    description={`The settlement for ${settlement.referralSourceName} will be marked cancelled. This cannot be undone.`}
                    confirmLabel="Cancel Settlement"
                    destructive
                    onConfirm={() => handleCancel(settlement)}
                  />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Referral Settlement"
        description="Generate, review and settle referral commission payouts."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="size-3.5" /> Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdfBulk}>
              <FileText className="size-3.5" /> Export PDF
            </Button>
            <RippleButton
              size="sm"
              onClick={() => {
                setGenerateForId(undefined);
                setGenerateOpen(true);
              }}
            >
              Generate Settlement
            </RippleButton>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search referral / remarks"
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPageIndex(0);
                  }}
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as "all" | SettlementStatus);
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-full max-w-xs">
                <SearchableSelect
                  options={referralOptions}
                  value={referralSourceId}
                  onChange={(v) => {
                    setReferralSourceId(v);
                    setPageIndex(0);
                  }}
                  placeholder="All Referrals"
                  searchPlaceholder="Search referral sources…"
                  className="h-9"
                />
              </div>
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
        showColumnVisibility
        emptyState={
          isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load settlements"
              description="Something went wrong while fetching referral settlements. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No settlements found"
              description="Try adjusting your search or filters, or generate a new settlement."
            />
          )
        }
      />

      <GenerateSettlementDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        defaultReferralSourceId={generateForId}
      />
      <ReferralSettlementDetailSheet
        settlement={viewSettlement ?? null}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setViewId(null);
        }}
      />
    </div>
  );
}

export { ReferralSettlementsPage };
