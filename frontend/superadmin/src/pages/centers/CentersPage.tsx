import { useEffect, useMemo, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/format";
import { useCenters, useDeleteCenter, useSetCenterStatus } from "@/hooks/queries/useCenters";
import { centerTypeLabel, type DiagnosticCenter } from "@/services/api/serviceCenterApi";

import { CenterFormDialog } from "./CenterFormDialog";

type StatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 10;

function CentersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<DiagnosticCenter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiagnosticCenter | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, statusFilter, page],
  );

  const { data, isLoading, isError, error } = useCenters(queryParams);
  const centers = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeCountQuery = useCenters({ isActive: true, page: 1, pageSize: 1 });

  const setStatus = useSetCenterStatus();
  const deleteCenter = useDeleteCenter();

  function handleToggleActive(center: DiagnosticCenter) {
    setStatus.mutate(
      { id: center.id, isActive: !center.isActive },
      {
        onSuccess: () => {
          toast.success(`${center.name} marked ${!center.isActive ? "active" : "inactive"}.`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update status.");
        },
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteCenter.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete center.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<DiagnosticCenter>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.address}</span>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div className="flex flex-col text-sm">
          <span>{c.phone ?? "—"}</span>
          <span className="text-xs text-muted-foreground">{c.email ?? ""}</span>
        </div>
      ),
    },
    {
      key: "coords",
      header: "Coordinates",
      render: (c) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (c) =>
        c.centerType ? <Badge variant="outline">{centerTypeLabel(c.centerType)}</Badge> : "—",
    },
    {
      key: "rating",
      header: "Rating",
      render: (c) => (
        <div className="flex items-center gap-1 tabular-nums">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {c.rating.toFixed(1)}{" "}
          <span className="text-xs text-muted-foreground">({formatNumber(c.reviewCount)})</span>
        </div>
      ),
    },
    {
      key: "active",
      header: "Active",
      render: (c) => <Switch checked={c.isActive} onCheckedChange={() => handleToggleActive(c)} />,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-24",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              setEditingCenter(c);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(c);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Diagnostic Centers"
        description="Manage the labs/centers patients see under 'nearest lab' in the patient app."
        actions={
          <Button
            onClick={() => {
              setEditingCenter(null);
              setFormOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="size-4" /> Add Center
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Centers"
          value={formatNumber(total)}
          icon={MapPin}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Active Centers"
          value={formatNumber(activeCountQuery.data?.total ?? 0)}
          icon={MapPin}
          gradient="bg-emerald-500"
          index={1}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px] max-w-xs flex-1"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={MapPin}
          title="Couldn't load centers"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : centers.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No diagnostic centers found"
          description="Try adjusting your search or filters, or add a new center."
          action={
            <Button
              onClick={() => {
                setEditingCenter(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Center
            </Button>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} data={centers} rowKey={(c) => c.id} pageSize={PAGE_SIZE} />

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

      <CenterFormDialog open={formOpen} onOpenChange={setFormOpen} center={editingCenter} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete center?"
        description={`This will permanently remove "${deleteTarget?.name}" from the nearest-lab list. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { CentersPage };
