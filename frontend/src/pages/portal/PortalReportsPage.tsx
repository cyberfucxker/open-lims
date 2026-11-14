import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Download, FileText, Search } from "lucide-react";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PortalDocumentPreviewDialog } from "@/components/portal/PortalDocumentPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReports } from "@/hooks/queries/useReports";
import { fetchReportPdfBlob } from "@/services/api/report.api";
import type { ReportListItem, ReportViewStatus } from "@/types/report";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

function PortalReportsPage() {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [previewReport, setPreviewReport] = useState<ReportListItem | null>(null);

  const view: ReportViewStatus = "all";
  const { data, isLoading, isFetching, isError, refetch } = useReports({
    search,
    view,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const columns = useMemo<ColumnDef<ReportListItem>[]>(
    () => [
      {
        accessorKey: "reportNo",
        header: "Report No",
        meta: { label: "Report No" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.reportNo}</p>
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
        accessorKey: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => (
          <StatusBadge
            status={titleCaseStatus(row.original.status)}
            variant={sampleReportBadgeVariant(row.original.status)}
          />
        ),
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
              disabled={
                row.original.status !== "APPROVED" &&
                row.original.status !== "SUBMITTED" &&
                row.original.status !== "PRINTED"
              }
              onClick={() => setPreviewReport(row.original)}
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
      <PageHeader title="Reports" description="View and download your patients' reports." />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports…"
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
              title="Couldn't load reports"
              description="Something went wrong while fetching reports. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No reports found"
              description="Reports will appear here once available."
            />
          )
        }
      />

      {previewReport && (
        <PortalDocumentPreviewDialog
          open={!!previewReport}
          onOpenChange={(open) => !open && setPreviewReport(null)}
          title={previewReport.reportNo}
          subtitle={previewReport.patient.fullName}
          downloadFilename={`${previewReport.reportNo}.pdf`}
          fetchBlob={() => fetchReportPdfBlob(previewReport.id)}
        />
      )}
    </div>
  );
}

export { PortalReportsPage };
