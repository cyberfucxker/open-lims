import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Loader2, Save, Send, ShieldCheck, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApproveTestResult,
  useReportDetails,
  useRejectTestResult,
  useSaveTestResult,
  useSubmitTestResult,
} from "@/hooks/queries/useReports";
import { useReportSettings } from "@/hooks/queries/useReportSettings";
import { useSignatories } from "@/hooks/queries/useSignatories";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type {
  ReportParameterResultLine,
  ResultFlag,
  SaveParameterResultInput,
} from "@/types/report";
import { sampleReportBadgeVariant, titleCaseStatus } from "@/utils/statusLabel";

const FLAG_OPTIONS: { value: ResultFlag; label: string }[] = [
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL_LOW", label: "Critical Low" },
  { value: "CRITICAL_HIGH", label: "Critical High" },
];

function TestReportEntryPage() {
  const { id, resultId } = useParams<{ id: string; resultId: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useReportDetails(id ?? null);

  const [paramRows, setParamRows] = useState<
    (SaveParameterResultInput & {
      name: string;
      unit: string | null;
      referenceRangeText: string | null;
    })[]
  >([]);
  const [freeTextValue, setFreeTextValue] = useState("");
  const [unit, setUnit] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [method, setMethod] = useState("");
  const [remarks, setRemarks] = useState("");
  const [flag, setFlag] = useState<ResultFlag>("NORMAL");
  const [isCritical, setIsCritical] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);

  const [selectedSignatoryIds, setSelectedSignatoryIds] = useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const saveTestResult = useSaveTestResult();
  const submitTestResult = useSubmitTestResult();
  const approveTestResult = useApproveTestResult();
  const rejectTestResult = useRejectTestResult();
  const { data: signatoriesData } = useSignatories({ active: "true", pageSize: 100 });
  const signatories = signatoriesData?.rows ?? [];
  const { data: reportSettings } = useReportSettings();
  const minSignaturesRequired = reportSettings?.minSignaturesRequired ?? 1;

  const target = report?.results.find((r) => r.id === resultId) ?? null;

  useEffect(() => {
    if (!target) return;
    setParamRows(
      target.parameters.map((p: ReportParameterResultLine) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        referenceRangeText: p.referenceRangeText,
        resultValue: p.resultValue ?? "",
        machineValue: p.machineValue ?? "",
        flag: p.flag,
        highlight: p.highlight,
      })),
    );
    setFreeTextValue(target.resultValue ?? "");
    setUnit(target.unit ?? "");
    setReferenceRange(target.referenceRange ?? "");
    setMethod(target.method ?? "");
    setRemarks(target.remarks ?? "");
    setFlag(target.flag);
    setIsCritical(target.isCritical);
    setSelectedSignatoryIds(new Set(target.signatoryIds));
  }, [target]);

  const isEditable = target
    ? ["PENDING", "IN_PROGRESS", "REJECTED"].includes(target.status)
    : false;
  const hasParameters = paramRows.length > 0;

  const updateParamRow = (index: number, patch: Partial<SaveParameterResultInput>) => {
    setParamRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const buildSaveInput = () => ({
    resultValue: hasParameters ? undefined : freeTextValue,
    unit: hasParameters ? undefined : unit,
    referenceRange: hasParameters ? undefined : referenceRange,
    method: hasParameters ? undefined : method,
    remarks,
    flag,
    isCritical,
    autoCalculate,
    parameters: hasParameters
      ? paramRows.map(({ id: paramId, resultValue, machineValue, flag: pFlag, highlight }) => ({
          id: paramId,
          resultValue,
          machineValue,
          flag: pFlag,
          highlight,
        }))
      : undefined,
  });

  const handleSave = () => {
    if (!id || !resultId) return;
    saveTestResult.mutate(
      { reportId: id, resultId, input: buildSaveInput() },
      {
        onSuccess: () => toast.success("Draft saved"),
        onError: (error) =>
          toast.error(error instanceof ApiRequestError ? error.message : "Failed to save"),
      },
    );
  };

  const handleSubmit = async () => {
    if (!id || !resultId) return;
    try {
      await saveTestResult.mutateAsync({ reportId: id, resultId, input: buildSaveInput() });
      await submitTestResult.mutateAsync({ reportId: id, resultId });
      toast.success("Test submitted for approval");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to submit");
    }
  };

  const toggleSignatory = (signatoryId: string) => {
    setSelectedSignatoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(signatoryId)) next.delete(signatoryId);
      else next.add(signatoryId);
      return next;
    });
  };

  const handleApprove = () => {
    if (!id || !resultId) return;
    approveTestResult.mutate(
      { reportId: id, resultId, input: { signatoryIds: [...selectedSignatoryIds] } },
      {
        onSuccess: () => toast.success("Test approved"),
        onError: (error) =>
          toast.error(error instanceof ApiRequestError ? error.message : "Failed to approve"),
      },
    );
  };

  const handleReject = () => {
    if (!id || !resultId || !rejectReason.trim()) return;
    rejectTestResult.mutate(
      { reportId: id, resultId, input: { reason: rejectReason.trim() } },
      {
        onSuccess: () => {
          toast.success("Sent back for revision");
          setRejectOpen(false);
          setRejectReason("");
        },
        onError: (error) =>
          toast.error(error instanceof ApiRequestError ? error.message : "Failed to reject"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !report || !target) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Test result not found"
        description="This test may have been removed from the bill."
        actionLabel="Back to Generate Reports"
        onAction={() => navigate("/admin/reports/generate")}
      />
    );
  }

  const sampleApproved = target.sampleStatus === "APPROVED";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => navigate("/admin/reports/generate")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={target.testName}
            description={`${report.patient.fullName} · ${report.patient.gender}, ${report.patient.age}y · ${report.appointmentNo} · Sample ${target.sampleNo ?? "--"}`}
            actions={
              <StatusBadge
                status={titleCaseStatus(target.status)}
                variant={sampleReportBadgeVariant(target.status)}
              />
            }
          />
        </div>
      </div>

      {!sampleApproved && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="size-4 shrink-0" />
          Sample is{" "}
          {target.sampleStatus ? titleCaseStatus(target.sampleStatus) : "not yet collected"} — it
          must be Approved before this test's result can be entered.
        </div>
      )}

      {hasParameters ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {paramRows.length} parameter{paramRows.length === 1 ? "" : "s"}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={autoCalculate} onCheckedChange={setAutoCalculate} />
            Auto Calculation
          </label>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        {hasParameters ? (
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Test Name</th>
                <th className="px-3 py-2 text-left font-medium">Result</th>
                <th className="px-3 py-2 text-left font-medium">Machine Value</th>
                <th className="px-3 py-2 text-left font-medium">UOM</th>
                <th className="px-3 py-2 text-left font-medium">Reference Range</th>
                <th className="px-3 py-2 text-left font-medium">Flag</th>
                <th className="px-3 py-2 text-left font-medium">Highlight</th>
              </tr>
            </thead>
            <tbody>
              {paramRows.map((row, index) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 align-top font-medium text-foreground">{row.name}</td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      className="h-8 w-28"
                      value={row.resultValue ?? ""}
                      disabled={!isEditable}
                      onChange={(e) => updateParamRow(index, { resultValue: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Input
                      className="h-8 w-28"
                      value={row.machineValue ?? ""}
                      disabled={!isEditable}
                      onChange={(e) => updateParamRow(index, { machineValue: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                    {row.unit ?? "--"}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                    {row.referenceRangeText ?? "--"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Select
                      value={row.flag ?? "NORMAL"}
                      onValueChange={(v) => updateParamRow(index, { flag: v as ResultFlag })}
                      disabled={!isEditable}
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
                      checked={row.highlight}
                      disabled={!isEditable}
                      onCheckedChange={(checked) =>
                        updateParamRow(index, { highlight: checked === true })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Result</Label>
              <Input
                value={freeTextValue}
                disabled={!isEditable}
                onChange={(e) => setFreeTextValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unit</Label>
              <Input
                value={unit}
                disabled={!isEditable}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reference Range</Label>
              <Input
                value={referenceRange}
                disabled={!isEditable}
                onChange={(e) => setReferenceRange(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Method</Label>
              <Input
                value={method}
                disabled={!isEditable}
                onChange={(e) => setMethod(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Flag</Label>
              <Select
                value={flag}
                onValueChange={(v) => setFlag(v as ResultFlag)}
                disabled={!isEditable}
              >
                <SelectTrigger>
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
            </div>
            <label className="flex items-center gap-2 self-end text-sm">
              <Checkbox
                checked={isCritical}
                disabled={!isEditable}
                onCheckedChange={(checked) => setIsCritical(checked === true)}
              />
              Critical
            </label>
            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
              <Label>Remarks</Label>
              <Input
                value={remarks}
                disabled={!isEditable}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {target.status === "SUBMITTED" && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium">Doctor Signature</p>
          <div className="flex flex-wrap gap-2">
            {signatories.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No signatories configured yet — add one under Reports → Signatories.
              </p>
            ) : (
              signatories.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={selectedSignatoryIds.has(s.id)}
                    onCheckedChange={() => toggleSignatory(s.id)}
                  />
                  {s.name}
                  {!s.hasPasskey && (
                    <Badge variant="outline" className="text-[10px]">
                      No passkey
                    </Badge>
                  )}
                </label>
              ))
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {minSignaturesRequired} signature(s) required before dispatch —{" "}
            {selectedSignatoryIds.size} selected
          </p>
        </div>
      )}

      {rejectOpen && (
        <div className="flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <Label>Reason for sending back</Label>
          <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={!rejectReason.trim() || rejectTestResult.isPending}
              onClick={handleReject}
            >
              Confirm Send Back
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {isEditable && sampleApproved && (
          <>
            <Button variant="outline" onClick={handleSave} disabled={saveTestResult.isPending}>
              <Save className="size-4" /> Save
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveTestResult.isPending || submitTestResult.isPending}
            >
              <Send className="size-4" /> Submit
            </Button>
          </>
        )}
        {target.status === "SUBMITTED" && (
          <>
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              <XCircle className="size-4" /> Send Back
            </Button>
            <Button
              onClick={handleApprove}
              disabled={
                approveTestResult.isPending || selectedSignatoryIds.size < minSignaturesRequired
              }
            >
              <ShieldCheck className="size-4" /> Approve
            </Button>
          </>
        )}
        {target.status === "APPROVED" && (
          <Badge variant="success" className="gap-1">
            Approved
          </Badge>
        )}
      </div>
    </div>
  );
}

export { TestReportEntryPage };
