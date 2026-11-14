import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  AlertTriangle,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Receipt,
  Search,
  Send,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DatePicker } from "@/components/common/DatePicker";
import { InvoicePreviewDialog } from "@/components/billing/InvoicePreviewDialog";
import { SendInvoiceDialog } from "@/components/billing/SendInvoiceDialog";
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
import { useBillDetails, useBills, useCancelBill } from "@/hooks/queries/useBills";
import {
  downloadBlob,
  fetchBillsExcelBlob,
  fetchBillsPdfBlob,
  fetchInvoicePdfBlob,
} from "@/services/api/billApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { BillListItem, BillViewStatus } from "@/types/bill";
import { getBillViewStatus } from "@/utils/billViewStatus";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TABS: { value: BillViewStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "due", label: "Due" },
  { value: "paid", label: "Paid" },
  { value: "free", label: "Free" },
  { value: "cancelled", label: "Cancelled" },
];

function BillListPage() {
  const [view, setView] = useState<BillViewStatus>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [isEmergency, setIsEmergency] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [previewBillId, setPreviewBillId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendBillId, setSendBillId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

  const { data: sendBill } = useBillDetails(sendBillId);
  const cancelBill = useCancelBill();

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
  const { data, isLoading, isFetching, isError, refetch } = useBills(params);

  const openPreview = (id: string) => {
    setPreviewBillId(id);
    setPreviewOpen(true);
  };

  const handleQuickDownload = async (bill: BillListItem) => {
    try {
      const blob = await fetchInvoicePdfBlob(bill.id);
      downloadBlob(blob, `${bill.billNo}.pdf`);
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const handleCancel = async (bill: BillListItem) => {
    try {
      await cancelBill.mutateAsync(bill.id);
      toast.success(`${bill.billNo} cancelled`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to cancel bill");
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await fetchBillsExcelBlob(params);
      downloadBlob(blob, "bills.xlsx");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await fetchBillsPdfBlob(params);
      downloadBlob(blob, "bills.pdf");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const columns = useMemo<ColumnDef<BillListItem>[]>(
    () => [
      {
        accessorKey: "billNo",
        header: "Bill No",
        meta: { label: "Bill No" },
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-xs font-medium">{row.original.billNo}</p>
            <p className="text-[11px] text-muted-foreground">{row.original.appointmentNo}</p>
          </div>
        ),
      },
      {
        accessorKey: "patient",
        header: "Patient",
        meta: { label: "Patient" },
        enableSorting: false,
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
        id: "createdBy",
        header: "Created By",
        meta: { label: "Created By" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.createdBy ?? "--"}</span>
        ),
      },
      {
        id: "referral",
        header: "Referral",
        meta: { label: "Referral" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.patient.referral || "--"}
          </span>
        ),
      },
      {
        id: "b2b",
        header: "B2B",
        meta: { label: "B2B" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.patient.organization || "--"}
          </span>
        ),
      },
      {
        id: "tests",
        header: "Tests",
        meta: { label: "Tests" },
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[220px]">
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
        meta: { label: "Status" },
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={getBillViewStatus(row.original)} />,
      },
      {
        accessorKey: "netAmount",
        header: "Amount",
        meta: { label: "Amount" },
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium text-foreground">
              ₹{row.original.netAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-emerald-600">
              Paid ₹{row.original.amountPaid.toLocaleString("en-IN")}
            </p>
            {row.original.dueAmount > 0 && (
              <p className="text-amber-600">
                Due ₹{row.original.dueAmount.toLocaleString("en-IN")}
              </p>
            )}
          </div>
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
              <DropdownMenuItem onClick={() => handleQuickDownload(row.original)}>
                <Download className="size-4" /> Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSendBillId(row.original.id);
                  setSendOpen(true);
                }}
              >
                <Send className="size-4" /> Send Invoice
              </DropdownMenuItem>
              {row.original.status === "ACTIVE" && (
                <ConfirmDialog
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="size-4" /> Cancel Bill
                    </DropdownMenuItem>
                  }
                  title="Cancel this bill?"
                  description={`${row.original.billNo} will be marked cancelled. This cannot be undone.`}
                  confirmLabel="Cancel Bill"
                  destructive
                  onConfirm={() => handleCancel(row.original)}
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bill List"
        description="View, print and manage patient bills, invoices and payments."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="size-3.5" /> Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <FileText className="size-3.5" /> Export PDF
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4">
          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as BillViewStatus);
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
                  placeholder="Name / Bill# / Appointment# / Mobile"
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
              title="Couldn't load bills"
              description="Something went wrong while fetching bills. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No bills found"
              description="Try adjusting your search or filters to find what you're looking for."
            />
          )
        }
      />

      <InvoicePreviewDialog
        billId={previewBillId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
      <SendInvoiceDialog bill={sendBill ?? null} open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  );
}

export { BillListPage };
