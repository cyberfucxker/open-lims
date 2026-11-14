import { AlertOctagon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/DataTable";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useFranchiseReports } from "@/hooks/queries/useFranchise";
import type { FranchiseReportRow } from "@/services/api/franchiseApi";

import { FranchiseListShell } from "./FranchiseListShell";
import { useDebouncedSearch } from "./useDebouncedSearch";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<string, { label: string; variant: NonNullable<BadgeProps["variant"]> }> =
  {
    PENDING: { label: "Pending", variant: "warning" },
    RECEIVED: { label: "Received", variant: "info" },
    PROCESSING: { label: "Processing", variant: "info" },
    PARTIAL: { label: "Partial", variant: "warning" },
    APPROVED: { label: "Approved", variant: "success" },
    SUBMITTED: { label: "Submitted", variant: "success" },
    PRINTED: { label: "Printed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };

const columns: DataTableColumn<FranchiseReportRow>[] = [
  {
    key: "reportNo",
    header: "Report No",
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs tracking-wider text-foreground">{row.reportNo}</span>
        {row.isEmergency && <AlertOctagon className="size-3.5 text-destructive" />}
      </div>
    ),
  },
  {
    key: "patient",
    header: "Patient",
    render: (row) => (
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">{row.patientName}</span>
        <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
          {row.patientId}
        </span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => {
      const badge = STATUS_BADGE[row.status] ?? {
        label: row.status,
        variant: "outline" as const,
      };
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
    },
  },
  {
    key: "createdAt",
    header: "Created",
    className: "text-right",
    render: (row) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {new Date(row.createdAt).toLocaleDateString()}
      </span>
    ),
  },
];

function FranchiseReportsPage() {
  const search = useDebouncedSearch();

  const query = useFranchiseReports({
    search: search.value || undefined,
    page: search.page,
    pageSize: PAGE_SIZE,
  });

  return (
    <FranchiseListShell
      title="Reports"
      description="Reports for patients registered under your franchise."
      searchValue={search.input}
      onSearchChange={search.setInput}
      searchPlaceholder="Search by report number or patient..."
      onReset={search.reset}
      columns={columns}
      rows={query.data?.rows ?? []}
      rowKey={(row) => row.id}
      isLoading={query.isLoading}
      error={query.isError ? query.error : null}
      onRetry={() => void query.refetch()}
      page={search.page}
      pageSize={PAGE_SIZE}
      total={query.data?.total ?? 0}
      onPageChange={search.setPage}
      emptyTitle="No reports found"
      emptyDescription="Reports for your patients will appear here once they are generated."
    />
  );
}

export { FranchiseReportsPage };
