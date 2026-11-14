import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrescriptions, useSetPrescriptionStatus } from "@/hooks/queries/usePrescriptions";
import { useCityList } from "@/hooks/queries/useCityMaster";
import { resolveUploadUrl } from "@/services/api/httpClient";
import type { Prescription, PrescriptionStatus } from "@/services/api/prescriptionApi";
import { formatDateTime, formatNumber } from "@/lib/format";

const PAGE_SIZE = 10;
type StatusFilter = PrescriptionStatus | "all";

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** The queue for prescriptions patients upload from the app.
 *
 *  The upload has existed on the patient side for a while and had nowhere to
 *  land: `Prescription.status` and `rejectionReason` were in the schema with
 *  nothing able to set them, so every upload sat at SUBMITTED forever and the
 *  patient never heard back. This is the other half — read the file, then
 *  approve it or reject it with a reason they can act on.
 */
export function PrescriptionsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [cityId, setCityId] = useState("all");
  const [page, setPage] = useState(1);

  const [rejecting, setRejecting] = useState<Prescription | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Debounced so typing doesn't fire a request per keystroke — same shape as
  // `CustomersPage`, which is the other server-filtered table here.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Any filter change invalidates the current page number — page 4 of the old
  // result set is rarely page 4 of the new one, and is often past its end.
  useEffect(() => {
    setPage(1);
  }, [search, status, cityId]);

  const listQuery = usePrescriptions({
    search: search || undefined,
    status: status === "all" ? undefined : status,
    cityId: cityId === "all" ? undefined : cityId,
    page,
    pageSize: PAGE_SIZE,
  });
  const citiesQuery = useCityList({ pageSize: 100 });
  const setPrescriptionStatus = useSetPrescriptionStatus();

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.total ?? 0;
  const counts = listQuery.data?.statusCounts;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function resetFilters() {
    setSearchInput("");
    setStatus("all");
    setCityId("all");
  }

  function approve(prescription: Prescription) {
    setPrescriptionStatus.mutate(
      { id: prescription.id, status: "APPROVED" },
      {
        onSuccess: () => toast.success("Prescription approved"),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not approve"),
      },
    );
  }

  function confirmRejection() {
    if (!rejecting) return;
    setPrescriptionStatus.mutate(
      { id: rejecting.id, status: "REJECTED", rejectionReason: rejectionReason.trim() },
      {
        onSuccess: () => {
          toast.success("Prescription rejected");
          setRejecting(null);
          setRejectionReason("");
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not reject"),
      },
    );
  }

  const columns: DataTableColumn<Prescription>[] = useMemo(
    () => [
      {
        key: "patient",
        header: "Patient",
        render: (row) => (
          <div className="min-w-0">
            {/* Falls back to the account holder: the family member can be
                deleted after upload, and a blank cell would look like a bug
                rather than "this row is still someone's". */}
            <p className="font-medium text-foreground">{row.patientName ?? row.customerName}</p>
            <p className="text-xs text-muted-foreground">
              {row.patientMobile ?? row.customerMobile}
              {row.relation ? ` · ${row.relation}` : ""}
            </p>
          </div>
        ),
      },
      {
        key: "account",
        header: "Uploaded by",
        render: (row) => (
          <div className="min-w-0">
            <p className="text-sm text-foreground">{row.customerName}</p>
            <p className="text-xs text-muted-foreground">{row.customerMobile}</p>
          </div>
        ),
      },
      {
        key: "city",
        header: "City",
        render: (row) => (
          <span className="text-sm text-muted-foreground">{row.cityName ?? "—"}</span>
        ),
      },
      {
        key: "query",
        header: "Note",
        render: (row) => (
          <p
            className="max-w-[18rem] truncate text-sm text-muted-foreground"
            title={row.query ?? ""}
          >
            {row.query || "—"}
          </p>
        ),
      },
      {
        key: "createdAt",
        header: "Uploaded",
        render: (row) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {formatDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <div className="space-y-1">
            <StatusPill status={row.status.toLowerCase()} />
            {row.rejectionReason && (
              <p
                className="max-w-[14rem] text-xs text-muted-foreground"
                title={row.rejectionReason}
              >
                {row.rejectionReason}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <a href={resolveUploadUrl(row.fileUrl)} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" /> File
              </a>
            </Button>
            {row.status !== "APPROVED" && (
              <Button
                variant="outline"
                size="sm"
                disabled={setPrescriptionStatus.isPending}
                onClick={() => approve(row)}
              >
                <CheckCircle2 className="size-3.5" /> Approve
              </Button>
            )}
            {row.status !== "REJECTED" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={setPrescriptionStatus.isPending}
                onClick={() => {
                  setRejecting(row);
                  setRejectionReason("");
                }}
              >
                <XCircle className="size-3.5" /> Reject
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `approve` is a stable closure over the mutation
    [setPrescriptionStatus.isPending],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescriptions"
        description="Prescriptions patients uploaded from the app — read the file, then approve it or reject it with a reason."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Awaiting review"
          value={formatNumber(counts?.SUBMITTED ?? 0)}
          icon={FileText}
          alert={(counts?.SUBMITTED ?? 0) > 0}
          onClick={() => setStatus("SUBMITTED")}
        />
        <StatCard
          title="Approved"
          value={formatNumber(counts?.APPROVED ?? 0)}
          icon={CheckCircle2}
          onClick={() => setStatus("APPROVED")}
        />
        <StatCard
          title="Rejected"
          value={formatNumber(counts?.REJECTED ?? 0)}
          icon={XCircle}
          onClick={() => setStatus("REJECTED")}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by patient, customer, phone or note..."
            className="min-w-[220px] flex-1"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {(citiesQuery.data?.rows ?? []).map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
          <span className="text-xs text-muted-foreground">
            Showing {formatNumber(rows.length)} of {formatNumber(total)}
          </span>
        </CardContent>
      </Card>

      {listQuery.isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "Failed to load prescriptions."}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => listQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : listQuery.isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            pageSize={PAGE_SIZE}
            emptyTitle="No prescriptions found"
            emptyDescription="Nothing matches these filters yet."
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 px-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* A rejection has to carry a reason — it is what the patient is shown,
          and "rejected" alone just gets the same unreadable photo re-uploaded.
          The API enforces it too; this is so nobody meets that error. */}
      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this prescription</DialogTitle>
            <DialogDescription>
              {rejecting?.patientName ?? rejecting?.customerName} will see this reason, so say what
              would make a re-upload work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="rejection-reason">Reason</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. The photo is too blurred to read the dosage — please re-upload in better light."
              maxLength={500}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={!rejectionReason.trim() || setPrescriptionStatus.isPending}
              onClick={confirmRejection}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
