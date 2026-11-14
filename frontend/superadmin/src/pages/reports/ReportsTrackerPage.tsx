import { useEffect, useState } from "react";
import { AlertTriangle, Clock, FileClock, FileDown, RotateCcw } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusPill } from "@/components/common/StatusPill";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { DonutChartCard } from "@/components/charts/DonutChartCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useReportTracker } from "@/hooks/queries/useReportTracker";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { ReportTrackerItem, ReportTrackerStatus } from "@/services/api/reportTrackerApi";
import { cn } from "@/utils/cn";

import { SlaBadge } from "./SlaBadge";

type StatusFilter = "all" | ReportTrackerStatus;

const PAGE_SIZE = 10;

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

function ReportsTrackerPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [breachedOnly, setBreachedOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, breachedOnly, dateFrom, dateTo]);

  const trackerQuery = useReportTracker({
    search: search || undefined,
    status: statusFilter,
    breachedOnly: breachedOnly || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = trackerQuery.data?.rows ?? [];
  const total = trackerQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stats = trackerQuery.data?.stats;

  const statusBreakdown = stats
    ? [
        { name: "Not Uploaded", value: stats.pendingUpload, color: "var(--destructive)" },
        { name: "Uploaded", value: stats.uploadedNotDownloaded, color: "var(--warning)" },
        { name: "Downloaded", value: stats.downloaded, color: "var(--success)" },
      ]
    : [];

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setBreachedOnly(false);
    setDateFrom("");
    setDateTo("");
  }

  const columns: DataTableColumn<ReportTrackerItem>[] = [
    {
      key: "reportNo",
      header: "Report No",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.reportNo}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Name",
      render: (row) => <span className="font-medium text-foreground">{row.customerName}</span>,
    },
    {
      key: "testName",
      header: "Test Name",
      render: (row) => <span className="max-w-56 truncate text-sm">{row.testName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "tatHours",
      header: "TAT",
      render: (row) => (
        <span className="tabular-nums">{row.tatHours != null ? `${row.tatHours} hrs` : "—"}</span>
      ),
    },
    {
      key: "collectedAt",
      header: "Collected At",
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {row.collectedAt ? formatDateTime(row.collectedAt) : "—"}
        </span>
      ),
    },
    {
      key: "dueAt",
      header: "Due At",
      render: (row) => (
        <span
          className={cn(
            "text-sm whitespace-nowrap",
            row.slaBreached ? "font-medium text-destructive" : "text-foreground",
          )}
        >
          {row.dueAt ? formatDateTime(row.dueAt) : "—"}
        </span>
      ),
    },
    {
      key: "sla",
      header: "SLA",
      render: (row) => <SlaBadge breached={row.slaBreached} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reports Delivery Tracker"
        description="Monitor report upload/download status and TAT SLA compliance across all collected samples."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {trackerQuery.isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Reports Pending Upload"
              value={formatNumber(stats?.pendingUpload ?? 0)}
              icon={FileClock}
              gradient="bg-amber-500"
              index={0}
            />
            <StatCard
              title="Uploaded, Not Downloaded"
              value={formatNumber(stats?.uploadedNotDownloaded ?? 0)}
              icon={FileDown}
              gradient="bg-sky-500"
              index={1}
            />
            <StatCard
              title="SLA Breaches"
              value={formatNumber(stats?.slaBreaches ?? 0)}
              icon={AlertTriangle}
              gradient="bg-orange-500"
              index={2}
              alert={(stats?.slaBreaches ?? 0) > 0}
            />
            <StatCard
              title="Avg TAT (hrs)"
              value={`${stats?.avgTatHours ?? 0} hrs`}
              icon={Clock}
              gradient="bg-violet-500"
              index={3}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by customer, report no, or sample no..."
                  className="min-w-[220px] flex-1"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_uploaded">Not Uploaded</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="downloaded">Downloaded</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <Switch
                    id="breached-only"
                    checked={breachedOnly}
                    onCheckedChange={setBreachedOnly}
                  />
                  <Label
                    htmlFor="breached-only"
                    className="text-xs whitespace-nowrap text-muted-foreground"
                  >
                    SLA breached only
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
                  <RotateCcw className="size-3.5" /> Reset
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                    Report Created From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Showing {formatNumber(rows.length)} of {formatNumber(total)} reports
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        <DonutChartCard title="Reports by Status" data={statusBreakdown} centerLabel="Reports" />
      </div>

      {trackerQuery.isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {trackerQuery.error instanceof Error
              ? trackerQuery.error.message
              : "Failed to load reports."}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => trackerQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : trackerQuery.isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            pageSize={PAGE_SIZE}
            rowClassName={(row) =>
              cn(row.slaBreached && "border-l-4 border-l-destructive bg-destructive/[0.03]")
            }
            emptyTitle="No reports found"
            emptyDescription="Try adjusting your search or filters to see report delivery records."
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
    </div>
  );
}

export { ReportsTrackerPage };
