import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, GripVertical, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import { resolveUploadUrl } from "@/services/api/httpClient";
import {
  useBanners,
  useDeleteBanner,
  useReorderBanners,
  useSetBannerStatus,
} from "@/hooks/queries/useBanners";
import type { BannerDto } from "@/services/api/bannerApi";
import { cn } from "@/utils/cn";

import { BannerFormDialog } from "./BannerFormDialog";

type ActiveFilter = "all" | "active" | "inactive";

function bannerLifecycle(banner: BannerDto): { label: string; className: string } {
  const now = Date.now();
  const start = banner.validFrom ? new Date(banner.validFrom).getTime() : null;
  const end = banner.validUntil ? new Date(banner.validUntil).getTime() : null;
  if (!banner.isActive) return { label: "Disabled", className: "text-muted-foreground" };
  if (start && now < start) return { label: "Scheduled", className: "text-info" };
  if (end && now > end) return { label: "Expired", className: "text-destructive" };
  return { label: "Live now", className: "text-success" };
}

function BannersTab() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BannerDto | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useBanners({
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    page: 1,
    pageSize: 100,
  });
  const banners = useMemo(() => data?.rows ?? [], [data]);

  const setStatus = useSetBannerStatus();
  const deleteBanner = useDeleteBanner();
  const reorder = useReorderBanners();

  const canReorder = activeFilter === "all";

  function openAddDialog() {
    setEditingBanner(null);
    setFormOpen(true);
  }

  function openEditDialog(banner: BannerDto) {
    setEditingBanner(banner);
    setFormOpen(true);
  }

  function handleToggleActive(banner: BannerDto, isActive: boolean) {
    setStatus.mutate(
      { id: banner.id, isActive },
      {
        onSuccess: () =>
          toast.success(isActive ? "Banner is now active" : "Banner was deactivated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update banner status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteBanner.mutate(target.id, {
      onSuccess: () => {
        toast.success("Banner was removed");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete banner.");
        setDeleteTarget(null);
      },
    });
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex || !canReorder) {
      setDragIndex(null);
      return;
    }
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    reorder.mutate(
      reordered.map((b) => b.id),
      {
        onSuccess: () => toast.success("Banner order updated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to reorder banners."),
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
              <SelectItem value="all">All banners</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            Add Banner
          </Button>
        </CardContent>
      </Card>

      {!canReorder && (
        <p className="text-xs text-muted-foreground">
          Clear the status filter to drag and reorder banners.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={ImageIcon}
          title="Couldn't load banners"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No banners found"
          description="Try a different filter, or add a new banner to the home-screen slider."
          action={
            <Button onClick={openAddDialog} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add Banner
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((banner, i) => {
            const lifecycle = bannerLifecycle(banner);
            return (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                draggable={canReorder}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow sm:flex-row sm:items-center",
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

                <div className="relative flex h-16 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary/40 sm:w-28">
                  {banner.imageUrl ? (
                    <img
                      src={resolveUploadUrl(banner.imageUrl)}
                      alt="Banner"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-[11px] font-medium", lifecycle.className)}>
                      {lifecycle.label}
                    </span>
                  </div>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {banner.imageUrl}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {banner.validFrom ? formatDate(banner.validFrom) : "Anytime"} –{" "}
                    {banner.validUntil ? formatDate(banner.validUntil) : "No expiry"}
                  </span>
                </div>

                <div className="flex items-center gap-4 sm:gap-5">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(banner)}>
                    Edit
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Active</span>
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={(checked) => handleToggleActive(banner, checked)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(banner)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <BannerFormDialog open={formOpen} onOpenChange={setFormOpen} banner={editingBanner} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete banner?"
        description="This banner will be removed from the home-screen slider. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { BannersTab };
