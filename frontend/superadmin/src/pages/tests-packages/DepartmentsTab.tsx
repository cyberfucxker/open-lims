import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import type { DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useCategories, useDepartments } from "@/hooks/queries/useMasterData";
import { useDeleteDepartment, useSetDepartmentStatus } from "@/hooks/queries/useDepartments";
import type { DepartmentDto } from "@/services/api/departmentApi";

import { DepartmentFormDialog } from "./DepartmentFormDialog";

function DepartmentsTab() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentDto | null>(null);

  const { data, isLoading, isError, error } = useDepartments();

  // The catalogue is small enough to count usage client-side, which avoids adding
  // a dedicated aggregate endpoint just to render one column (same approach
  // `SampleTypesTab` uses against Tests).
  const { data: categoriesResult } = useCategories();
  const categoryCountByDepartmentId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const category of categoriesResult?.rows ?? []) {
      counts.set(category.departmentId, (counts.get(category.departmentId) ?? 0) + 1);
    }
    return counts;
  }, [categoriesResult]);

  const departments = useMemo(() => {
    const rows = data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.code ?? "").toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const setStatus = useSetDepartmentStatus();
  const deleteDepartment = useDeleteDepartment();

  function handleToggleActive(department: DepartmentDto) {
    setStatus.mutate(
      { id: department.id, active: !department.active },
      {
        onSuccess: () => {
          toast.success(
            `${department.name} marked as ${!department.active ? "active" : "inactive"}.`,
          );
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
    deleteDepartment.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete department.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<DepartmentDto>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{d.name}</span>
          {d.description && (
            <span className="max-w-72 truncate text-xs text-muted-foreground">{d.description}</span>
          )}
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (d) =>
        d.code ? (
          <span className="font-mono text-xs tabular-nums">{d.code}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "usage",
      header: "Categories",
      render: (d) => {
        const count = categoryCountByDepartmentId.get(d.id) ?? 0;
        return (
          <Badge variant={count > 0 ? "secondary" : "outline"} className="tabular-nums">
            {count} categor{count === 1 ? "y" : "ies"}
          </Badge>
        );
      },
    },
    {
      key: "active",
      header: "Active",
      render: (d) => <Switch checked={d.active} onCheckedChange={() => handleToggleActive(d)} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (d) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setEditingDepartment(d);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(d)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setEditingDepartment(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Department
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Building2}
          title="Couldn't load departments"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Try adjusting your search, or add a new department."
          action={
            <Button
              onClick={() => {
                setEditingDepartment(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Department
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={departments} rowKey={(d) => d.id} pageSize={10} />
      )}

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        department={editingDepartment}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete department?"
        description={(() => {
          if (!deleteTarget) return "";
          const count = categoryCountByDepartmentId.get(deleteTarget.id) ?? 0;
          return count > 0
            ? `"${deleteTarget.name}" has ${count} categor${count === 1 ? "y" : "ies"} filed under it. They'll keep working, but consider re-filing them first, or turn Active off to retire it instead.`
            : `This will remove "${deleteTarget.name}" from the department list.`;
        })()}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { DepartmentsTab };
