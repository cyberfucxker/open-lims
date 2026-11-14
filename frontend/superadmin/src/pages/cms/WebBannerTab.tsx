import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, Image as ImageIcon, Package, Plus, Trash2 } from "lucide-react";
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
  useDeleteWebBanner,
  useReorderWebBanners,
  useSetWebBannerStatus,
  useWebBanners,
} from "@/hooks/queries/useWebBanners";
import type { WebBannerDto, WebBannerPlacement } from "@/services/api/webBannerApi";
import { cn } from "@/utils/cn";

import { WebBannerFormDialog } from "./WebBannerFormDialog";

type ActiveFilter = "all" | "active" | "inactive";
type PlacementFilter = "all" | WebBannerPlacement;

/** The website's hero carousel. Sibling of `BannersTab` (the app's image-only
 *  strip) — the difference that matters is the package link: price, discount
 *  and parameter count are never entered here, they're read off the package
 *  when the site renders, per city. */
function WebBannerTab() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  // Two mastheads share this table, so the first thing anyone wants is to see
  // one of them at a time.
  const [placementFilter, setPlacementFilter] = useState<PlacementFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebBannerDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebBannerDto | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useWebBanners({
    placement: placementFilter === "all" ? undefined : placementFilter,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    page: 1,
    pageSize: 100,
  });
  const banners = useMemo(() => data?.rows ?? [], [data]);

  const setStatus = useSetWebBannerStatus();
  const deleteBanner = useDeleteWebBanner();
  const reorder = useReorderWebBanners();

  const canReorder = activeFilter === "all" && placementFilter !== "all";

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(banner: WebBannerDto) {
    setEditing(banner);
    setFormOpen(true);
  }

  function handleToggleActive(banner: WebBannerDto, isActive: boolean) {
    setStatus.mutate(
      { id: banner.id, isActive },
      {
        onSuccess: () => toast.success(isActive ? "Slide is now live" : "Slide was hidden"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update slide status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteBanner.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Slide was removed");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete slide.");
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
        onSuccess: () => toast.success("Slide order updated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to reorder slides."),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={placementFilter}
                onValueChange={(v) => setPlacementFilter(v as PlacementFilter)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Shows on" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Home &amp; city</SelectItem>
                  <SelectItem value="HOME">Home page only</SelectItem>
                  <SelectItem value="CITY">City pages only</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={activeFilter}
                onValueChange={(v) => setActiveFilter(v as ActiveFilter)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All slides</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="inactive">Inactive only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            Add Slide
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Two separate mastheads. A <strong>Home</strong> slide is artwork only — the home hero draws
        its own heading, search box and buttons over it. A <strong>City</strong> slide carries copy,
        and attaching a package pulls its price, discount and parameter count live for the visitor's
        city — nothing to keep in sync by hand.
        {!canReorder &&
          " Pick one placement, with no status filter, to drag and reorder its slides."}
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={ImageIcon}
          title="Couldn't load slides"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No slides yet"
          description="Add a slide to the website's home-page hero carousel."
          action={
            <Button onClick={openAdd} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add Slide
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((banner, i) => (
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
                "flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3",
                canReorder && "cursor-grab active:cursor-grabbing",
                dragIndex === i && "opacity-50",
              )}
            >
              {canReorder && (
                <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}

              <div className="h-16 w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
                <img
                  src={resolveUploadUrl(banner.imageUrl)}
                  alt=""
                  className="size-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => openEdit(banner)}
                className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
              >
                <span className="flex flex-wrap items-center gap-2">
                  {/* Which masthead this slide belongs to. Leading the row
                      because the two lists live in one table, and telling
                      them apart by their copy alone is guesswork. */}
                  <span
                    className={
                      banner.placement === "HOME"
                        ? "rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-600 uppercase dark:text-sky-400"
                        : "rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400"
                    }
                  >
                    {banner.placement === "HOME" ? "Home" : "City"}
                  </span>
                  {banner.badge && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                      {banner.badge}
                    </span>
                  )}
                  <span className="font-medium text-foreground">
                    {banner.title ?? "Image-only slide"}
                  </span>
                </span>
                {banner.subtitle && (
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {banner.subtitle}
                  </span>
                )}
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="size-3.5" />
                  {banner.placement === "HOME" ? (
                    <>
                      Home hero artwork
                      {banner.linkUrl ? ` · ${banner.linkUrl}` : " · no link"}
                    </>
                  ) : banner.packageName ? (
                    <>
                      {banner.packageName}
                      <span className="text-[11px]">· price shown live</span>
                    </>
                  ) : (
                    <>Promo slide — no price{banner.linkUrl ? ` · ${banner.linkUrl}` : ""}</>
                  )}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={banner.isActive}
                  onCheckedChange={(v) => handleToggleActive(banner, v)}
                  aria-label="Slide active"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(banner)}
                  aria-label="Delete slide"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <WebBannerFormDialog open={formOpen} onOpenChange={setFormOpen} banner={editing} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this slide?"
        description="It will be removed from the website's hero carousel. The package itself is not affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { WebBannerTab };
