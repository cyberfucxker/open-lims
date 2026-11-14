import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Pencil,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AvatarChip } from "@/components/common/AvatarChip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
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
import { formatDate, formatNumber } from "@/lib/format";
import {
  useDeletePhlebotomist,
  usePhlebotomistsList,
  useSetPhlebotomistStatus,
} from "@/hooks/queries/usePhlebotomists";
import type { PhlebotomistDto } from "@/services/api/phlebotomistApi";

import { getAvatarColor } from "./phleboUtils";
import { PhleboFormDrawer } from "./PhleboFormDrawer";
import { isManager } from "@/config/staffModules";
import { useAuth } from "@/hooks/useAuth";

type StatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 10;

function PhlebosPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhlebo, setEditingPhlebo] = useState<PhlebotomistDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhlebotomistDto | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, statusFilter, page],
  );

  const { data, isLoading, isError, error } = usePhlebotomistsList(queryParams);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeCountQuery = usePhlebotomistsList({ isActive: true, page: 1, pageSize: 1 });
  const inactiveCountQuery = usePhlebotomistsList({ isActive: false, page: 1, pageSize: 1 });

  const setStatus = useSetPhlebotomistStatus();
  const deletePhlebotomist = useDeletePhlebotomist();
  const managerSession = isManager(useAuth().user);

  function openAddDrawer() {
    setEditingPhlebo(null);
    setFormOpen(true);
  }

  function openEditDrawer(phlebo: PhlebotomistDto) {
    setEditingPhlebo(phlebo);
    setFormOpen(true);
  }

  function handleToggleActive(phlebo: PhlebotomistDto) {
    setStatus.mutate(
      { id: phlebo.id, isActive: !phlebo.isActive },
      {
        onSuccess: () =>
          toast.success(`${phlebo.name} marked ${!phlebo.isActive ? "active" : "inactive"}.`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deletePhlebotomist.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete phlebotomist.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<PhlebotomistDto>[] = [
    {
      key: "phlebo",
      header: "Phlebotomist",
      render: (p) => <AvatarChip name={p.name} color={getAvatarColor(p.id)} subtitle={p.mobile} />,
    },
    {
      key: "joined",
      header: "Joined",
      render: (p) => (
        <span className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</span>
      ),
    },
    {
      key: "active",
      header: "Active",
      render: (p) => <Switch checked={p.isActive} onCheckedChange={() => handleToggleActive(p)} />,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-36",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              openEditDrawer(p);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          {/* Deleting stays ADMIN-only (the API refuses a manager too). */}
          {!managerSession && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(p);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/phlebos/${p.id}`);
            }}
          >
            View
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Phlebotomists"
        description="Manage field phlebotomists available for order assignment."
        actions={
          <Button onClick={openAddDrawer}>
            <UserPlus className="size-4" />
            Add Phlebotomist
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Phlebotomists"
          value={formatNumber(total)}
          icon={Users}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Active"
          value={formatNumber(activeCountQuery.data?.total ?? 0)}
          icon={UserCheck}
          gradient="bg-emerald-500"
          index={1}
        />
        <StatCard
          title="Inactive"
          value={formatNumber(inactiveCountQuery.data?.total ?? 0)}
          icon={UserX}
          gradient="bg-amber-500"
          index={2}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or mobile..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            Showing {formatNumber(rows.length)} of {formatNumber(total)} phlebotomists
          </span>
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
          icon={Users}
          title="Couldn't load phlebotomists"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No phlebotomists found"
          description="Try adjusting your search or filters, or add a new phlebotomist."
          action={
            <Button onClick={openAddDrawer} variant="outline" size="sm">
              <UserPlus className="size-3.5" />
              Add Phlebotomist
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/phlebos/${p.id}`)}
            pageSize={PAGE_SIZE}
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

      <PhleboFormDrawer open={formOpen} onOpenChange={setFormOpen} phlebotomist={editingPhlebo} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete phlebotomist?"
        description={`"${deleteTarget?.name}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { PhlebosPage };
