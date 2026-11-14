import { useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
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
import {
  useDeleteSlotTemplate,
  useSetSlotTemplateStatus,
  useSlotTemplates,
} from "@/hooks/queries/useSlotTemplates";
import type { SlotTemplateDto } from "@/services/api/slotTemplateApi";

import { SlotTemplateFormDialog } from "./SlotTemplateFormDialog";
import { to12Hour } from "./slotFormat";

type ActiveFilter = "all" | "active" | "inactive";

function SlotTemplatesTab() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SlotTemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SlotTemplateDto | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useSlotTemplates({
    search: search || undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
    page: 1,
    pageSize: 100,
  });
  const templates = data?.rows ?? [];

  const setStatus = useSetSlotTemplateStatus();
  const deleteTemplate = useDeleteSlotTemplate();

  function openAddDialog() {
    setEditingTemplate(null);
    setFormOpen(true);
  }

  function openEditDialog(template: SlotTemplateDto) {
    setEditingTemplate(template);
    setFormOpen(true);
  }

  function handleToggleActive(template: SlotTemplateDto, active: boolean) {
    setStatus.mutate(
      { id: template.id, active },
      {
        onSuccess: () =>
          toast.success(
            active ? `"${template.title}" is now active` : `"${template.title}" was deactivated`,
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update template status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteTemplate.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Slot template "${target.title}" was deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete slot template.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<SlotTemplateDto>[] = [
    {
      key: "title",
      header: "Title",
      render: (t) => <span className="font-medium text-foreground">{t.title}</span>,
    },
    {
      key: "time",
      header: "Time Window",
      render: (t) => (
        <span className="text-sm text-muted-foreground">
          {to12Hour(t.startTime)} – {to12Hour(t.endTime)}
        </span>
      ),
    },
    {
      key: "capacity",
      header: "Default Capacity",
      render: (t) => <span className="tabular-nums">{t.defaultCapacity}</span>,
    },
    {
      key: "active",
      header: "Active",
      render: (t) => (
        <Switch checked={t.active} onCheckedChange={(checked) => handleToggleActive(t, checked)} />
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-24",
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(t)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(t)}
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
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            Add Template
          </Button>
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
          icon={CalendarClock}
          title="Couldn't load slot templates"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No slot templates found"
          description="Try adjusting your search or filter, or create a new slot template."
          action={
            <Button onClick={openAddDialog} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add Template
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={templates} rowKey={(t) => t.id} pageSize={8} />
      )}

      <SlotTemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editingTemplate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete slot template?"
        description={`"${deleteTarget?.title ?? ""}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { SlotTemplatesTab };
