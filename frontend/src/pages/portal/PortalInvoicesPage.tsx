import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Download, Receipt, Search } from "lucide-react";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PortalDocumentPreviewDialog } from "@/components/portal/PortalDocumentPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBills } from "@/hooks/queries/useBills";
import { fetchInvoicePdfBlob } from "@/services/api/billApi";
import type { BillListItem } from "@/types/bill";
import { getBillViewStatus } from "@/utils/billViewStatus";

function PortalInvoicesPage() {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [previewBill, setPreviewBill] = useState<BillListItem | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useBills({
    search,
    view: "all",
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const columns = useMemo<ColumnDef<BillListItem>[]>(
    () => [
      {
        accessorKey: "billNo",
        header: "Invoice No",
        meta: { label: "Invoice No" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.billNo}</p>
            <p className="text-xs text-muted-foreground">{row.original.appointmentNo}</p>
          </div>
        ),
      },
      {
        accessorKey: "patient",
        header: "Patient",
        meta: { label: "Patient" },
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.patient.fullName}</span>
        ),
      },
      {
        accessorKey: "netAmount",
        header: "Net Amount",
        meta: { label: "Net Amount" },
        cell: ({ row }) => `₹${row.original.netAmount.toLocaleString("en-IN")}`,
      },
      {
        accessorKey: "paymentStatus",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => <StatusBadge status={getBillViewStatus(row.original)} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="View / Download"
              onClick={() => setPreviewBill(row.original)}
            >
              <Download className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Invoices" description="View and download invoices for your patients." />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(0);
            }}
          />
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
              title="Couldn't load invoices"
              description="Something went wrong while fetching invoices. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No invoices found"
              description="Invoices will appear here once available."
            />
          )
        }
      />

      {previewBill && (
        <PortalDocumentPreviewDialog
          open={!!previewBill}
          onOpenChange={(open) => !open && setPreviewBill(null)}
          title={previewBill.billNo}
          subtitle={previewBill.patient.fullName}
          downloadFilename={`${previewBill.billNo}.pdf`}
          fetchBlob={() => fetchInvoicePdfBlob(previewBill.id)}
        />
      )}
    </div>
  );
}

export { PortalInvoicesPage };
