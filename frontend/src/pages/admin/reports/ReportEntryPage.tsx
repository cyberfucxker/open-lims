import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ReportCancelDialog } from "@/components/reports/ReportCancelDialog";
import { ReportRejectDialog } from "@/components/reports/ReportRejectDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApproveReport,
  useReportDetails,
  useSaveResults,
  useSubmitReport,
} from "@/hooks/queries/useReports";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReportResultLine, ResultFlag, SaveResultLineInput } from "@/types/report";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

const FLAG_OPTIONS: { value: ResultFlag; label: string }[] = [
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL_LOW", label: "Critical Low" },
  { value: "CRITICAL_HIGH", label: "Critical High" },
];

type EditableRow = SaveResultLineInput & {
  testName: string;
  testShortName: string;
  sampleStatus: string | null;
  sampleNo: string | null;
};

function toEditableRows(results: ReportResultLine[]): EditableRow[] {
  return results.map((r) => ({
    appointmentTestId: r.appointmentTestId,
    resultValue: r.resultValue ?? "",
    unit: r.unit ?? "",
    referenceRange: r.referenceRange ?? "",
    method: r.method ?? "",
    remarks: r.remarks ?? "",
    flag: r.flag,
    isCritical: r.isCritical,
    testName: r.testName,
    testShortName: r.testShortName,
    sampleStatus: r.sampleStatus,
    sampleNo: r.sampleNo,
  }));
}

function ReportEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useReportDetails(id ?? null);

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const resultInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const saveResults = useSaveResults();
  const submitReport = useSubmitReport();
  const approveReport = useApproveReport();

  useEffect(() => {
    if (report) setRows(toEditableRows(report.results));
  }, [report]);

  // Ctrl/Cmd+Enter → save draft, from anywhere on the page.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveDraft();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const isEditable = report
    ? ["PENDING", "RECEIVED", "PROCESSING", "PARTIAL"].includes(report.status)
    : false;
  const allFilled =
    rows.length > 0 && rows.every((r) => (r.resultValue ?? "").toString().trim().length > 0);

  const updateRow = (index: number, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const toSaveInput = (): SaveResultLineInput[] =>
    rows.map(
      ({
        testName: _testName,
        testShortName: _testShortName,
        sampleStatus: _sampleStatus,
        sampleNo: _sampleNo,
        ...rest
      }) => rest,
    );

  const handleSaveDraft = () => {
    if (!id || rows.length === 0) return;
    saveResults.mutate(
      { id, input: { results: toSaveInput() } },
      {
        onSuccess: () => toast.success("Draft saved"),
        onError: (error) =>
          toast.error(error instanceof ApiRequestError ? error.message : "Failed to save results"),
      },
    );
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await saveResults.mutateAsync({ id, input: { results: toSaveInput() } });
      await submitReport.mutateAsync(id);
      toast.success("Report submitted for approval");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to submit report");
    }
  };

  const handleApprove = () => {
    if (!id) return;
    approveReport.mutate(id, {
      onSuccess: () => toast.success("Report approved"),
      onError: (error) =>
        toast.error(error instanceof ApiRequestError ? error.message : "Failed to approve"),
    });
  };

  const blockedSamples = useMemo(
    () => rows.filter((r) => r.sampleStatus === "PENDING" || r.sampleStatus === "REJECTED"),
    [rows],
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Report not found"
        description="This report may have been removed."
        actionLabel="Back to Report List"
        onAction={() => navigate("/admin/reports")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => navigate("/admin/reports")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={`Report Entry — ${report.reportNo}`}
            description={`${report.patient.fullName} · ${report.patient.gender}, ${report.patient.age}y · ${report.appointmentNo}`}
            actions={
              <StatusBadge
                status={titleCaseStatus(report.status)}
                variant={sampleReportBadgeVariant(report.status)}
              />
            }
          />
        </div>
      </div>

      {report.isEmergency && (
        <Badge variant="destructive" className="w-fit">
          STAT — Emergency Report
        </Badge>
      )}

      {blockedSamples.length > 0 && isEditable && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="size-4 shrink-0" />
          {blockedSamples.length} test{blockedSamples.length === 1 ? "" : "s"} blocked — sample not
          yet received or was rejected. Collect/receive the sample before submitting.
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Test</th>
              <th className="px-3 py-2 text-left font-medium">Result</th>
              <th className="px-3 py-2 text-left font-medium">Unit</th>
              <th className="px-3 py-2 text-left font-medium">Reference Range</th>
              <th className="px-3 py-2 text-left font-medium">Method</th>
              <th className="px-3 py-2 text-left font-medium">Flag</th>
              <th className="px-3 py-2 text-left font-medium">Critical</th>
              <th className="px-3 py-2 text-left font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const blocked = row.sampleStatus === "PENDING" || row.sampleStatus === "REJECTED";
              return (
                <tr key={row.appointmentTestId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 align-top">
                    <p className="font-medium text-foreground">{row.testName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.testShortName}
                      {row.sampleNo ? ` · ${row.sampleNo}` : ""}
                    </p>
                    {blocked && (
                      <p className="text-xs font-medium text-destructive">
                        {row.sampleStatus === "PENDING" ? "Sample not received" : "Sample rejected"}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      ref={(el) => {
                        resultInputRefs.current[index] = el;
                      }}
                      className="h-8 w-28"
                      value={row.resultValue ?? ""}
                      disabled={!isEditable || blocked}
                      onChange={(e) => updateRow(index, { resultValue: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          resultInputRefs.current[index + 1]?.focus();
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      className="h-8 w-20"
                      value={row.unit ?? ""}
                      disabled={!isEditable || blocked}
                      onChange={(e) => updateRow(index, { unit: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      className="h-8 w-36"
                      value={row.referenceRange ?? ""}
                      disabled={!isEditable || blocked}
                      onChange={(e) => updateRow(index, { referenceRange: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      className="h-8 w-28"
                      value={row.method ?? ""}
                      disabled={!isEditable || blocked}
                      onChange={(e) => updateRow(index, { method: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Select
                      value={row.flag ?? "NORMAL"}
                      onValueChange={(v) => updateRow(index, { flag: v as ResultFlag })}
                      disabled={!isEditable || blocked}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FLAG_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Checkbox
                      checked={row.isCritical}
                      disabled={!isEditable || blocked}
                      onCheckedChange={(checked) =>
                        updateRow(index, { isCritical: checked === true })
                      }
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      className="h-8 w-40"
                      value={row.remarks ?? ""}
                      disabled={!isEditable || blocked}
                      onChange={(e) => updateRow(index, { remarks: e.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {isEditable && (
          <>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saveResults.isPending}>
              <Save className="size-4" /> Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allFilled || saveResults.isPending || submitReport.isPending}
            >
              <Send className="size-4" /> Submit
            </Button>
          </>
        )}
        {report.status === "SUBMITTED" && (
          <>
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              <XCircle className="size-4" /> Send Back
            </Button>
            <Button onClick={handleApprove} disabled={approveReport.isPending}>
              <ShieldCheck className="size-4" /> Approve
            </Button>
          </>
        )}
        {report.status === "APPROVED" && (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="size-3.5" /> Approved — ready to print
          </Badge>
        )}
        {report.status !== "PRINTED" && report.status !== "CANCELLED" && (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            Cancel Report
          </Button>
        )}
      </div>

      <ReportRejectDialog report={report} open={rejectOpen} onOpenChange={setRejectOpen} />
      <ReportCancelDialog report={report} open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  );
}

export { ReportEntryPage };
