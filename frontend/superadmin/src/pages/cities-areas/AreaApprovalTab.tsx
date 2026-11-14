import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useApproveAreaApprovalRequest,
  useAreaApprovalRequests,
  useRejectAreaApprovalRequest,
} from "@/hooks/queries/useAreaApprovalRequests";
import { formatDateTime } from "@/lib/format";
import type { AreaApprovalRequest, AreaApprovalStatus } from "@/services/api/areaApprovalApi";

const STATUS_FILTERS: { value: AreaApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_BADGE: Record<
  AreaApprovalStatus,
  { label: string; variant: "warning" | "success" | "destructive" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const PAGE_SIZE = 20;

/** Superadmin's "Area Approval" tab — every franchise's self-service
 *  new-area requests (`POST /franchise/area-requests`), reviewed here.
 *  Approving mints the real Area and hands it straight to the requesting
 *  franchise; rejecting just records why. See the backend's
 *  `AreaApprovalRequest` doc-comment for the full flow. */
function AreaApprovalTab() {
  const [status, setStatus] = useState<AreaApprovalStatus | "all">("PENDING");
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<AreaApprovalRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AreaApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const query = useAreaApprovalRequests({
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });
  const approve = useApproveAreaApprovalRequest();
  const reject = useRejectAreaApprovalRequest();

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleApprove() {
    if (!approveTarget) return;
    approve.mutate(approveTarget.id, {
      onSuccess: () => {
        toast.success(
          `"${approveTarget.name}" approved and assigned to ${approveTarget.organizationName}`,
        );
        setApproveTarget(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to approve request");
      },
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    reject.mutate(
      { id: rejectTarget.id, reason: rejectReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`"${rejectTarget.name}" rejected`);
          setRejectTarget(null);
          setRejectReason("");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to reject request");
        },
      },
    );
  }

  const columns: DataTableColumn<AreaApprovalRequest>[] = [
    {
      key: "name",
      header: "Area",
      render: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-foreground">{row.name}</span>
          {row.pincodes.length > 0 && (
            <span className="text-xs text-muted-foreground">{row.pincodes.join(", ")}</span>
          )}
        </div>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (row) => <span className="text-sm text-foreground">{row.cityName}</span>,
    },
    {
      key: "franchise",
      header: "Requested By",
      render: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="text-sm text-foreground">{row.organizationName}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.organizationCode}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const badge = STATUS_BADGE[row.status];
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Requested",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) =>
        row.status === "PENDING" ? (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setApproveTarget(row)}>
              <Check className="size-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setRejectTarget(row)}
            >
              <X className="size-3.5" />
              Reject
            </Button>
          </div>
        ) : row.status === "REJECTED" && row.rejectionReason ? (
          <span className="text-xs text-muted-foreground">{row.rejectionReason}</span>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as AreaApprovalStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            pageSize={PAGE_SIZE}
            emptyTitle="No area requests"
            emptyDescription="Franchises can request a new area from their own Profile page."
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

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(next) => !next && setApproveTarget(null)}
        title="Approve this area?"
        description={`"${approveTarget?.name}" will be created in ${approveTarget?.cityName} and immediately assigned to ${approveTarget?.organizationName}.`}
        confirmLabel="Approve"
        destructive={false}
        onConfirm={handleApprove}
      />

      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(next) => {
          if (!next) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this area request?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${rejectTarget?.name}" from ${rejectTarget?.organizationName} will be rejected. Optionally tell them why.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
          />
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={reject.isPending}
              onClick={handleReject}
            >
              {reject.isPending ? "Rejecting…" : "Reject"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { AreaApprovalTab };
