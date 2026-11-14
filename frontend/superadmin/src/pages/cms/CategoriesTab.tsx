import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { resolveUploadUrl } from "@/services/api/httpClient";
import {
  useAppCategories,
  useDeleteAppCategory,
  useReorderAppCategories,
  useSetAppCategoryStatus,
} from "@/hooks/queries/useAppCategories";
import type { AppCategoryDto } from "@/services/api/appCategoryApi";
import { cn } from "@/utils/cn";

import { CategoryFormDialog } from "./CategoryFormDialog";

type ActiveFilter = "all" | "active" | "inactive";

function CategoriesTab() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AppCategoryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppCategoryDto | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useAppCategories({
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    page: 1,
    pageSize: 100,
  });
  const categories = useMemo(() => data?.rows ?? [], [data]);

  const setStatus = useSetAppCategoryStatus();
  const deleteCategory = useDeleteAppCategory();
  const reorder = useReorderAppCategories();

  const canReorder = activeFilter === "all";

  function openAddDialog() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function openEditDialog(category: AppCategoryDto) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  function handleToggleActive(category: AppCategoryDto, isActive: boolean) {
    setStatus.mutate(
      { id: category.id, isActive },
      {
        onSuccess: () =>
          toast.success(
            isActive ? `"${category.name}" is now active` : `"${category.name}" was deactivated`,
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update category status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteCategory.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Category "${target.name}" was deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete category.");
        setDeleteTarget(null);
      },
    });
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex || !canReorder) {
      setDragIndex(null);
      return;
    }
    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    reorder.mutate(
      reordered.map((c) => c.id),
      {
        onSuccess: () => toast.success("Category order updated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to reorder categories."),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            Add Category
          </Button>
        </CardContent>
      </Card>

      {!canReorder && (
        <p className="text-xs text-muted-foreground">
          Clear the status filter to drag and reorder categories.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={LayoutGrid}
          title="Couldn't load categories"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No categories found"
          description="Try a different filter, or add a new home-screen category."
          action={
            <Button onClick={openAddDialog} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add Category
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              draggable={canReorder}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow",
                canReorder && "hover:shadow-md",
                dragIndex === i && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex items-center text-muted-foreground",
                  canReorder ? "cursor-grab active:cursor-grabbing" : "opacity-30",
                )}
              >
                <GripVertical className="size-5" />
              </div>

              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary/40">
                {category.thumbnailUrl || category.imageUrl ? (
                  <img
                    src={resolveUploadUrl(category.thumbnailUrl ?? category.imageUrl ?? "")}
                    alt={category.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <LayoutGrid className="size-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-foreground">
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
                  Edit
                </Button>
                <Switch
                  checked={category.isActive}
                  onCheckedChange={(checked) => handleToggleActive(category, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(category)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={`"${deleteTarget?.name ?? ""}" will be removed from the home screen. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { CategoriesTab };
