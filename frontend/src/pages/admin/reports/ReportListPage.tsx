import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  Printer,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { DataTable } from "@/components/common/DataTable";
import { DatePicker } from "@/components/common/DatePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ReportCancelDialog } from "@/components/reports/ReportCancelDialog";
import { ReportHistorySheet } from "@/components/reports/ReportHistorySheet";
import { ReportPreviewDialog } from "@/components/reports/ReportPreviewDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportDetails, useReports } from "@/hooks/queries/useReports";
import { downloadBlob } from "@/services/api/billApi";
import {
  fetchReportPdfBlob,
  fetchReportPrintBatchBlob,
  fetchReportsExcelBlob,
} from "@/services/api/report.api";
import type { ReportListItem, ReportViewStatus } from "@/types/report";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TABS: { value: ReportViewStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
  { value: "processing", label: "Processing" },
  { value: "partial", label: "Partial" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "printed", label: "Printed" },
  { value: "cancelled", label: "Cancelled" },
];

function ReportListPage() {
  const [view, setView] = useState<ReportViewStatus>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [isEmergency, setIsEmergency] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cancelReportId, setCancelReportId] = useState<string | null>(null);
  const [historyReportId, setHistoryReportId] = useState<string | null>(null);

  const { data: cancelReport } = useReportDetails(cancelReportId);
  const { data: historyReport } = useReportDetails(historyReportId);

  const params = {
    view,
    search: search || undefined,
    dateFrom,
    dateTo,
    isEmergency: isEmergency || undefined,
    page: pageIndex + 1,
    pageSize,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? ("desc" as const) : ("asc" as const),
  };
  const { data, isLoading, isFetching, isError, refetch } = useReports(params);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [view, pageIndex, search, dateFrom, dateTo, isEmergency]);

  const openPreview = (id: string) => {
    setPreviewId(id);
    setPreviewOpen(true);
  };

  const handleQuickDownload = async (report: ReportListItem) => {
    try {
      const blob = await fetchReportPdfBlob(report.id);
      downloadBlob(blob, `${report.reportNo}.pdf`);
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await fetchReportsExcelBlob(params);
      downloadBlob(blob, "reports.xlsx");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handleGroupPrint = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    try {
      const blob = await fetchReportPrintBatchBlob(ids);
      downloadBlob(blob, "reports.pdf");
    } catch {
      toast.error("Failed to generate group print");
    }
  };

  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const columns = useMemo<ColumnDef<ReportListItem>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) =>
              setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set())
            }
          />
        ),
        enableSorting: false,
        meta: { label: "Select" },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(checked) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (checked) next.add(row.original.id);
                else next.delete(row.original.id);
                return next;
              });
            }}
          />
        ),
      },
      {
        accessorKey: "reportNo",
        header: "Report No",
        meta: { label: "Report No" },
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-xs font-medium">{row.original.reportNo}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.appointmentNo} · {row.original.billNo ?? "--"}
            </p>
          </div>
        ),
      },
      {
        id: "patient",
        header: "Patient",
        enableSorting: false,
        meta: { label: "Patient" },
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback className="text-[11px]">
                {initials(row.original.patient.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {row.original.patient.fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.original.patient.gender}, {row.original.patient.age}y
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "tests",
        header: "Tests",
        enableSorting: false,
        meta: { label: "Tests" },
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            {row.original.tests.map((t) => (
              <p key={t.testId} className="truncate text-xs text-muted-foreground">
                {t.testName}
              </p>
            ))}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        meta: { label: "Status" },
        cell: ({ row }) => (
          <StatusBadge
            status={titleCaseStatus(row.original.status)}
            variant={sampleReportBadgeVariant(row.original.status)}
          />
        ),
      },
      {
        id: "emergency",
        header: "Emergency",
        enableSorting: false,
        meta: { label: "Emergency" },
        cell: ({ row }) =>
          row.original.isEmergency ? (
            <StatusBadge status="STAT" />
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        meta: { label: "Date" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openPreview(row.original.id)}>
                <Eye className="size-4" /> View / Print
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/reports/${row.original.id}/entry`}>
                  <FileText className="size-4" /> Report Entry
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickDownload(row.original)}>
                <Download className="size-4" /> Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHistoryReportId(row.original.id)}>
                <History className="size-4" /> History
              </DropdownMenuItem>
              {row.original.status !== "PRINTED" && row.original.status !== "CANCELLED" && (
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                  onClick={() => setCancelReportId(row.original.id)}
                >
                  <XCircle className="size-4" /> Cancel Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [allSelected, rows, selectedIds],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Report List"
        description="Track, verify and print lab reports through approval to delivery."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="size-3.5" /> Export Excel
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4">
          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as ReportViewStatus);
              setPageIndex(0);
            }}
          >
            <TabsList className="flex-wrap">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {data?.counts && (
                    <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
                      {data.counts[tab.value]}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Patient / Bill# / Appointment# / Sample#"
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPageIndex(0);
                  }}
                />
              </div>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={isEmergency}
                  onCheckedChange={(checked) => {
                    setIsEmergency(checked === true);
                    setPageIndex(0);
                  }}
                />
                Emergency
              </label>
              <Button
                type="button"
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <SlidersHorizontal className="size-3.5" /> More Filters
              </Button>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
                <Button size="sm" variant="outline" onClick={handleGroupPrint}>
                  <Printer className="size-3.5" /> Group Print
                </Button>
              </div>
            )}
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                    setIsEmergency(false);
                    setSearch("");
                    setPageIndex(0);
                  }}
                >
                  Reset filters
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
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
              title="Couldn't load reports"
              description="Something went wrong while fetching reports. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No reports found"
              description="Try adjusting your search or filters."
            />
          )
        }
      />

      <ReportPreviewDialog reportId={previewId} open={previewOpen} onOpenChange={setPreviewOpen} />
      <ReportCancelDialog
        report={cancelReport ?? null}
        open={!!cancelReportId}
        onOpenChange={(o) => !o && setCancelReportId(null)}
      />
      <ReportHistorySheet
        report={historyReport ?? null}
        open={!!historyReportId}
        onOpenChange={(o) => !o && setHistoryReportId(null)}
      />
    </div>
  );
}

export { ReportListPage };
