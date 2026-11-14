import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  Inbox,
  Printer,
  ScanLine,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { DataTable } from "@/components/common/DataTable";
import { DatePicker } from "@/components/common/DatePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SampleHistorySheet } from "@/components/samples/SampleHistorySheet";
import { SampleLabelPreviewDialog } from "@/components/samples/SampleLabelPreviewDialog";
import { SampleRejectDialog } from "@/components/samples/SampleRejectDialog";
import { Badge } from "@/components/ui/badge";
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
import {
  useApproveSample,
  useBulkApproveSamples,
  useBulkCollectSamples,
  useBulkReceiveSamples,
  useCollectSample,
  useReceiveSample,
  useSamples,
} from "@/hooks/queries/useSamples";
import { downloadBlob } from "@/services/api/billApi";
import { fetchSamplesExcelBlob } from "@/services/api/sample.api";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { SampleRecord, SampleViewStatus } from "@/types/sample";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

const TABS: { value: SampleViewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "collected", label: "Collected" },
  { value: "received", label: "Received" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

function SampleOrderPage() {
  const [view, setView] = useState<SampleViewStatus>("pending");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [isEmergency, setIsEmergency] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scanMode, setScanMode] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [rejectSample, setRejectSample] = useState<SampleRecord | null>(null);
  const [labelSample, setLabelSample] = useState<SampleRecord | null>(null);
  const [historySample, setHistorySample] = useState<SampleRecord | null>(null);

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
  const { data, isLoading, isFetching, isError, refetch } = useSamples(params);

  const collectSample = useCollectSample();
  const receiveSample = useReceiveSample();
  const approveSample = useApproveSample();
  const bulkCollect = useBulkCollectSamples();
  const bulkReceive = useBulkReceiveSamples();
  const bulkApprove = useBulkApproveSamples();

  useEffect(() => {
    setSelectedIds(new Set());
  }, [view, pageIndex, search, dateFrom, dateTo, isEmergency]);

  // Barcode Scan Mode — Enter looks up the scanned sample number against the
  // currently loaded rows and immediately fires the context-appropriate
  // action (Collect while viewing Pending, Receive while viewing Collected).
  const handleScanSubmit = () => {
    const code = scanValue.trim();
    setScanValue("");
    if (!code) return;
    const match = data?.rows.find((s) => s.sampleNo.toLowerCase() === code.toLowerCase());
    if (!match) {
      toast.error(`No sample found for "${code}" on this screen`);
      return;
    }
    if (view === "pending" && match.status === "PENDING") {
      collectSample.mutate(match.id, {
        onSuccess: () => toast.success(`${match.sampleNo} collected`),
        onError: (error) =>
          toast.error(error instanceof ApiRequestError ? error.message : "Failed to collect"),
      });
    } else if (match.status === "COLLECTED") {
      receiveSample.mutate(match.id, {
        onSuccess: () => toast.success(`${match.sampleNo} received`),
        onError: (error) =>
          toast.error(error instanceof ApiRequestError ? error.message : "Failed to receive"),
      });
    } else {
      toast.error(`${match.sampleNo} is ${match.status.toLowerCase()} — nothing to do`);
    }
  };

  // Keyboard shortcuts: Alt+S focus scan input, Alt+C/Alt+R bulk collect/receive selected.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setScanMode(true);
        window.setTimeout(() => scanInputRef.current?.focus(), 0);
      } else if (e.altKey && e.key.toLowerCase() === "c" && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkCollect();
      } else if (e.altKey && e.key.toLowerCase() === "r" && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkReceive();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  const handleBulkCollect = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    bulkCollect.mutate(ids, {
      onSuccess: (result) => {
        toast.success(
          `${result.succeeded.length} collected${result.failed.length ? `, ${result.failed.length} failed` : ""}`,
        );
        setSelectedIds(new Set());
      },
      onError: () => toast.error("Bulk collect failed"),
    });
  };

  const handleBulkReceive = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    bulkReceive.mutate(ids, {
      onSuccess: (result) => {
        toast.success(
          `${result.succeeded.length} received${result.failed.length ? `, ${result.failed.length} failed` : ""}`,
        );
        setSelectedIds(new Set());
      },
      onError: () => toast.error("Bulk receive failed"),
    });
  };

  const handleBulkApprove = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    bulkApprove.mutate(ids, {
      onSuccess: (result) => {
        toast.success(
          `${result.succeeded.length} approved${result.failed.length ? `, ${result.failed.length} failed` : ""}`,
        );
        setSelectedIds(new Set());
      },
      onError: () => toast.error("Bulk approve failed"),
    });
  };

  const handleExportExcel = async () => {
    try {
      const blob = await fetchSamplesExcelBlob(params);
      downloadBlob(blob, "samples.xlsx");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const columns = useMemo<ColumnDef<SampleRecord>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
            }}
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
        accessorKey: "sampleNo",
        header: "Sample No",
        meta: { label: "Sample No" },
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-xs font-medium">{row.original.sampleNo}</p>
            <p className="text-[11px] text-muted-foreground">{row.original.appointmentNo}</p>
          </div>
        ),
      },
      {
        id: "patient",
        header: "Patient",
        enableSorting: false,
        meta: { label: "Patient" },
        cell: ({ row }) => (
          <div>
            <p className="truncate text-sm font-medium text-foreground">
              {row.original.patient.fullName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.patient.gender}, {row.original.patient.age}y ·{" "}
              {row.original.patient.patientId}
            </p>
          </div>
        ),
      },
      {
        id: "sampleType",
        header: "Sample Type",
        enableSorting: false,
        meta: { label: "Sample Type" },
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {row.original.containerColor && (
              <span
                className="size-2.5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: row.original.containerColor }}
              />
            )}
            <div>
              <p className="text-sm">{row.original.sampleType}</p>
              {row.original.containerName && (
                <p className="text-[11px] text-muted-foreground">{row.original.containerName}</p>
              )}
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
          <div className="flex flex-col gap-1">
            <StatusBadge
              status={titleCaseStatus(row.original.status)}
              variant={sampleReportBadgeVariant(row.original.status)}
            />
            {row.original.isEmergency && (
              <Badge variant="destructive" className="w-fit text-[10px]">
                STAT
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        meta: { label: "Created" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleString("en-IN")}
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
              {row.original.status === "PENDING" && (
                <DropdownMenuItem
                  onClick={() =>
                    collectSample.mutate(row.original.id, {
                      onSuccess: () => toast.success(`${row.original.sampleNo} collected`),
                      onError: (error) =>
                        toast.error(
                          error instanceof ApiRequestError ? error.message : "Failed to collect",
                        ),
                    })
                  }
                >
                  <CheckCircle2 className="size-4" /> Collect Sample
                </DropdownMenuItem>
              )}
              {row.original.status === "COLLECTED" && (
                <DropdownMenuItem
                  onClick={() =>
                    receiveSample.mutate(row.original.id, {
                      onSuccess: () => toast.success(`${row.original.sampleNo} received`),
                      onError: (error) =>
                        toast.error(
                          error instanceof ApiRequestError ? error.message : "Failed to receive",
                        ),
                    })
                  }
                >
                  <Inbox className="size-4" /> Receive Sample
                </DropdownMenuItem>
              )}
              {row.original.status === "RECEIVED" && (
                <DropdownMenuItem
                  onClick={() =>
                    approveSample.mutate(row.original.id, {
                      onSuccess: () => toast.success(`${row.original.sampleNo} approved`),
                      onError: (error) =>
                        toast.error(
                          error instanceof ApiRequestError ? error.message : "Failed to approve",
                        ),
                    })
                  }
                >
                  <CheckCircle2 className="size-4" /> Approve Sample
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setLabelSample(row.original)}>
                <Printer className="size-4" /> Print Tube Label
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHistorySample(row.original)}>
                <History className="size-4" /> History
              </DropdownMenuItem>
              {row.original.status !== "REJECTED" && row.original.status !== "COMPLETED" && (
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                  onClick={() => setRejectSample(row.original)}
                >
                  <XCircle className="size-4" /> Reject Sample
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [allSelected, rows, selectedIds, collectSample, receiveSample, approveSample],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sample Order"
        description="Collect, receive and track specimens across the lab workflow."
        actions={
          <div className="flex gap-2">
            <Button
              variant={scanMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setScanMode((prev) => !prev);
                window.setTimeout(() => scanInputRef.current?.focus(), 0);
              }}
            >
              <ScanLine className="size-3.5" /> Scan Mode
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="size-3.5" /> Export Excel
            </Button>
          </div>
        }
      />

      {scanMode && (
        <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <ScanLine className="size-4 text-primary" />
          <Input
            ref={scanInputRef}
            autoFocus
            placeholder="Scan or type sample barcode, then press Enter…"
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleScanSubmit();
            }}
            className="flex-1 bg-background"
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4">
          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as SampleViewStatus);
              setPageIndex(0);
            }}
          >
            <TabsList>
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
                  placeholder="Patient / Sample# / Appointment#"
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkCollect}
                  disabled={bulkCollect.isPending}
                >
                  <CheckCircle2 className="size-3.5" /> Collect Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkReceive}
                  disabled={bulkReceive.isPending}
                >
                  <Inbox className="size-3.5" /> Receive Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkApprove}
                  disabled={bulkApprove.isPending}
                >
                  <CheckCircle2 className="size-3.5" /> Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const first = rows.find((r) => selectedIds.has(r.id));
                    if (first) setLabelSample(first);
                  }}
                >
                  <Download className="size-3.5" /> Print Labels
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
              title="Couldn't load samples"
              description="Something went wrong while fetching samples. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No samples found"
              description="Try adjusting your search or filters."
            />
          )
        }
      />

      <SampleRejectDialog
        sample={rejectSample}
        open={!!rejectSample}
        onOpenChange={(o) => !o && setRejectSample(null)}
      />
      <SampleLabelPreviewDialog
        sample={labelSample}
        open={!!labelSample}
        onOpenChange={(o) => !o && setLabelSample(null)}
      />
      <SampleHistorySheet
        sample={historySample}
        open={!!historySample}
        onOpenChange={(o) => !o && setHistorySample(null)}
      />
    </div>
  );
}

export { SampleOrderPage };
