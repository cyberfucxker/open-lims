import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AlertTriangle, FileSpreadsheet, FileText, Receipt } from "lucide-react";
import toast from "react-hot-toast";

import { DataTable } from "@/components/common/DataTable";
import { DatePicker } from "@/components/common/DatePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadBlob } from "@/services/api/billApi";
import {
  fetchFinanceReportExcelBlob,
  fetchFinanceReportPdfBlob,
} from "@/services/api/financeReportApi";
import { useFinanceReport } from "@/hooks/queries/useFinanceReport";
import { useOrganizations } from "@/hooks/queries/useOrganizations";
import { useReferralSources } from "@/hooks/queries/useReferralSources";
import type {
  FinanceReportFilters,
  FinanceReportGroupBy,
  FinanceReportGroupRow,
  FinanceReportRow,
} from "@/types/financeReport";

const GROUP_TABS: { value: FinanceReportGroupBy; label: string }[] = [
  { value: "date", label: "By Date Wise" },
  { value: "organisation", label: "By Organisation Wise Billing" },
  { value: "referral", label: "By Referral Wise Billing" },
];

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold tracking-tight ${tone ?? "text-navy-950"}`}>
        {formatInr(value)}
      </p>
    </div>
  );
}

function FinanceReportsPage() {
  const [groupBy, setGroupBy] = useState<FinanceReportGroupBy>("date");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [referralSourceId, setReferralSourceId] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [onlyCancelled, setOnlyCancelled] = useState(false);
  const [includeFree, setIncludeFree] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const filters: FinanceReportFilters = {
    dateFrom,
    dateTo,
    organizationId,
    referralSourceId,
    includeCancelled,
    onlyCancelled,
    includeFree,
    groupBy,
  };

  const { data, isLoading, isFetching, isError, refetch } = useFinanceReport(filters);
  const { data: organizations } = useOrganizations({ active: "true", pageSize: 100 });
  const { data: referralSources } = useReferralSources({ active: "true", pageSize: 100 });

  const organizationOptions = useMemo(
    () => (organizations?.rows ?? []).map((org) => ({ value: org.id, label: org.name })),
    [organizations],
  );
  const referralOptions = useMemo(
    () => (referralSources?.rows ?? []).map((src) => ({ value: src.id, label: src.name })),
    [referralSources],
  );

  const dateRows = data?.rows ?? [];
  const groupRows = data?.groups ?? [];
  const pagedDateRows = dateRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const pagedGroupRows = groupRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setOrganizationId(undefined);
    setReferralSourceId(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setIncludeCancelled(false);
    setOnlyCancelled(false);
    setIncludeFree(false);
    setPageIndex(0);
  };

  const handleExportExcel = async () => {
    try {
      const blob = await fetchFinanceReportExcelBlob(filters);
      downloadBlob(blob, "finance-report.xlsx");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await fetchFinanceReportPdfBlob(filters);
      downloadBlob(blob, "finance-report.pdf");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const dateColumns = useMemo<ColumnDef<FinanceReportRow>[]>(
    () => [
      {
        accessorKey: "billNo",
        header: "Invoice No",
        meta: { label: "Invoice No" },
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-xs font-medium">{row.original.billNo}</p>
            <p className="text-[11px] text-muted-foreground">{row.original.appointmentNo}</p>
          </div>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Name",
        meta: { label: "Name" },
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.patientName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.patientGender}, {row.original.patientAge}
            </p>
          </div>
        ),
      },
      {
        id: "receiptDate",
        header: "Receipt Date",
        meta: { label: "Receipt Date" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.receiptDate)}
          </span>
        ),
      },
      {
        accessorKey: "grossTotal",
        header: "Gross Total",
        meta: { label: "Gross Total" },
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm">{formatInr(row.original.grossTotal)}</span>,
      },
      {
        accessorKey: "netAmount",
        header: "Net Amount",
        meta: { label: "Net Amount" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatInr(row.original.netAmount)}</span>
        ),
      },
      {
        accessorKey: "paidAmount",
        header: "Paid Amount",
        meta: { label: "Paid Amount" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-emerald-600">{formatInr(row.original.paidAmount)}</span>
        ),
      },
      {
        accessorKey: "discountAmount",
        header: "Discount",
        meta: { label: "Discount" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">{formatInr(row.original.discountAmount)}</span>
        ),
      },
      {
        accessorKey: "dueAmount",
        header: "Due",
        meta: { label: "Due" },
        enableSorting: false,
        cell: ({ row }) =>
          row.original.dueAmount > 0 ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
              {formatInr(row.original.dueAmount)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">--</span>
          ),
      },
      {
        id: "paymentMode",
        header: "Payment Mode",
        meta: { label: "Payment Mode" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.paymentMode ?? "--"}</span>
        ),
      },
      {
        id: "organization",
        header: "Organization",
        meta: { label: "Organization" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.organization ?? "N/A"}
          </span>
        ),
      },
      {
        id: "doctor",
        header: "Doctor",
        meta: { label: "Doctor" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.doctor ?? "N/A"}</span>
        ),
      },
    ],
    [],
  );

  const groupColumns = useMemo<ColumnDef<FinanceReportGroupRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: groupBy === "organisation" ? "Organisation" : "Referral",
        meta: { label: "Name" },
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "billCount",
        header: "Bills",
        meta: { label: "Bills" },
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm">{row.original.billCount}</span>,
      },
      {
        accessorKey: "netAmount",
        header: "Net Amount",
        meta: { label: "Net Amount" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatInr(row.original.netAmount)}</span>
        ),
      },
      {
        accessorKey: "collectionAmount",
        header: "Collection",
        meta: { label: "Collection" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-emerald-600">
            {formatInr(row.original.collectionAmount)}
          </span>
        ),
      },
      {
        accessorKey: "discountAmount",
        header: "Discount",
        meta: { label: "Discount" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">{formatInr(row.original.discountAmount)}</span>
        ),
      },
      {
        accessorKey: "dueAmount",
        header: "Due",
        meta: { label: "Due" },
        enableSorting: false,
        cell: ({ row }) =>
          row.original.dueAmount > 0 ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
              {formatInr(row.original.dueAmount)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">--</span>
          ),
      },
    ],
    [groupBy],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Finance Reports"
        description="Billing collections, discounts and dues across walking, organisation and referral business."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="size-3.5" /> Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <FileText className="size-3.5" /> Print PDF
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Organization</label>
            <SearchableSelect
              options={organizationOptions}
              value={organizationId}
              onChange={(v) => {
                setOrganizationId(v || undefined);
                setPageIndex(0);
              }}
              placeholder="All"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Referral</label>
            <SearchableSelect
              options={referralOptions}
              value={referralSourceId}
              onChange={(v) => {
                setReferralSourceId(v || undefined);
                setPageIndex(0);
              }}
              placeholder="All"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date From</label>
            <DatePicker
              value={dateFrom}
              onChange={(v) => {
                setDateFrom(v);
                setPageIndex(0);
              }}
              placeholder="Date from"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date To</label>
            <DatePicker
              value={dateTo}
              onChange={(v) => {
                setDateTo(v);
                setPageIndex(0);
              }}
              placeholder="Date to"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Checkbox
              checked={includeCancelled}
              onCheckedChange={(v) => {
                setIncludeCancelled(v === true);
                setPageIndex(0);
              }}
            />
            With Cancel
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Checkbox
              checked={onlyCancelled}
              onCheckedChange={(v) => {
                setOnlyCancelled(v === true);
                setPageIndex(0);
              }}
            />
            Only Cancel
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Checkbox
              checked={includeFree}
              onCheckedChange={(v) => {
                setIncludeFree(v === true);
                setPageIndex(0);
              }}
            />
            With Free
          </label>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      <Tabs
        value={groupBy}
        onValueChange={(v) => {
          setGroupBy(v as FinanceReportGroupBy);
          setPageIndex(0);
        }}
      >
        <TabsList>
          {GROUP_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {data?.summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label="Total Net Amount" value={data.summary.totalNetAmount} />
          <SummaryCard
            label="Total Collection"
            value={data.summary.totalCollectionAmount}
            tone="text-emerald-600"
          />
          <SummaryCard label="Total Discount" value={data.summary.totalDiscountAmount} />
          <SummaryCard
            label="Total Due"
            value={data.summary.totalDueAmount}
            tone="text-amber-600"
          />
          <SummaryCard label="Cash" value={data.summary.cash} />
          <SummaryCard label="Online / Other" value={data.summary.online} />
        </div>
      )}

      {groupBy === "date" ? (
        <DataTable
          columns={dateColumns}
          data={pagedDateRows}
          isLoading={isLoading || isFetching}
          totalRows={dateRows.length}
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
                title="Couldn't load finance report"
                description="Something went wrong while fetching the report. Please try again."
                actionLabel="Retry"
                onAction={() => refetch()}
              />
            ) : (
              <EmptyState
                icon={Receipt}
                title="No billing activity found"
                description="Try adjusting the filters or date range."
              />
            )
          }
        />
      ) : (
        <DataTable
          columns={groupColumns}
          data={pagedGroupRows}
          isLoading={isLoading || isFetching}
          totalRows={groupRows.length}
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
            <EmptyState
              icon={Receipt}
              title="No billing activity found"
              description="Try adjusting the filters or date range."
            />
          }
        />
      )}
    </div>
  );
}

export { FinanceReportsPage };
