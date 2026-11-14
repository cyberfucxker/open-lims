import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";

import { DatePicker } from "@/components/common/DatePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CombinedReportPreviewDialog } from "@/components/reports/CombinedReportPreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useReports } from "@/hooks/queries/useReports";
import type { ReportListItem, ReportTestResultSummary } from "@/types/report";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

function TestRow({ reportId, test }: { reportId: string; test: ReportTestResultSummary }) {
  const sampleApproved = test.sampleStatus === "APPROVED";
  const canCreate = sampleApproved && ["PENDING", "IN_PROGRESS", "REJECTED"].includes(test.status);
  const alreadyStarted = test.status !== "PENDING";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{test.testName}</p>
        <p className="text-xs text-muted-foreground">{test.testShortName}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusBadge
          status={titleCaseStatus(test.status)}
          variant={sampleReportBadgeVariant(test.status)}
        />
        {!sampleApproved && (
          <span className="text-[10px] text-muted-foreground">
            Sample {test.sampleStatus ? titleCaseStatus(test.sampleStatus) : "Pending"}
          </span>
        )}
      </div>
      <div className="w-24 text-center">
        <span className="font-mono text-[11px] text-muted-foreground">{test.sampleNo ?? "--"}</span>
      </div>
      <div className="w-36 text-right">
        {canCreate ? (
          <Button size="sm" asChild>
            <Link to={`/admin/reports/${reportId}/test/${test.resultId}`}>
              {alreadyStarted ? "Continue" : "Create Report"}
            </Link>
          </Button>
        ) : test.status === "PENDING" ? (
          <Button size="sm" variant="outline" disabled title="Sample must be Approved first">
            Create Report
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link to={`/admin/reports/${reportId}/test/${test.resultId}`}>View</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function ReportCard({
  report,
  onPreview,
}: {
  report: ReportListItem;
  onPreview: (reportId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const approvedCount = report.testResults.filter((t) => t.status === "APPROVED").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary/40">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {report.patient.fullName}
              </span>
              <span className="text-xs text-muted-foreground">
                ({report.patient.age}Y - {report.patient.gender.charAt(0)})
              </span>
              {report.isEmergency && (
                <Badge variant="destructive" className="text-[10px]">
                  STAT
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Bill No.: {report.billNo ?? "--"} · {report.appointmentNo}
            </p>
          </div>
        </button>
        {approvedCount > 0 && (
          <Button size="sm" variant="outline" onClick={() => onPreview(report.id)}>
            <Eye className="size-3.5" /> Reports ({approvedCount})
          </Button>
        )}
        <StatusBadge
          status={titleCaseStatus(report.status)}
          variant={sampleReportBadgeVariant(report.status)}
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <div className="border-t border-border">
            {report.testResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No tests on this bill.</p>
            ) : (
              report.testResults.map((test) => (
                <TestRow key={test.resultId} reportId={report.id} test={test} />
              ))
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GenerateReportsPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [isEmergency, setIsEmergency] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);

  const params = {
    view: "all" as const,
    search: search || undefined,
    dateFrom,
    dateTo,
    isEmergency: isEmergency || undefined,
    page,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "desc" as const,
  };
  const { data, isLoading, isFetching, isError, refetch } = useReports(params);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo, isEmergency]);

  const rows = data?.rows.filter((r) => r.status !== "CANCELLED") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Generate Reports"
        description="Create each ordered test's report independently, once its sample is Approved."
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Patient / Appointment# / Bill# / Sample#"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Checkbox
                checked={isEmergency}
                onCheckedChange={(checked) => setIsEmergency(checked === true)}
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
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-secondary/40 p-3 sm:grid-cols-2 lg:grid-cols-3">
              <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Date from" />
              <DatePicker value={dateTo} onChange={setDateTo} placeholder="Date to" />
              <Button
                variant="ghost"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setIsEmergency(false);
                  setSearch("");
                }}
              >
                Reset filters
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load reports"
          description="Something went wrong while fetching reports. Please try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Refreshing…
            </div>
          )}
          {rows.map((report) => (
            <ReportCard key={report.id} report={report} onPreview={setPreviewReportId} />
          ))}
        </div>
      )}

      {data && data.total > 20 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {Math.ceil(data.total / 20)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(data.total / 20)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CombinedReportPreviewDialog
        reportId={previewReportId}
        open={!!previewReportId}
        onOpenChange={(o) => !o && setPreviewReportId(null)}
      />
    </div>
  );
}

export { GenerateReportsPage };
