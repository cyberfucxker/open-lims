import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  ExternalLink,
  FileText,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import {
  useCmsPages,
  useDeleteCmsPage,
  useDuplicateCmsPage,
  useSetCmsPageStatus,
} from "@/hooks/queries/useCmsPages";
import type { CmsAppType, CmsPageListItem, CmsPageStatus } from "@/services/api/cmsPageApi";

import { CmsPageEditorDialog } from "./CmsPageEditorDialog";

interface CmsPagesListProps {
  appType: CmsAppType;
}

type StatusFilter = CmsPageStatus | "all";

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
    </div>
  );
}

function CmsPagesList({ appType }: CmsPagesListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editorState, setEditorState] = useState<{
    pageId: string | null;
    initialTab: "edit" | "preview";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsPageListItem | null>(null);

  const pagesQuery = useCmsPages({
    appType,
    status: statusFilter,
    search: search.trim() || undefined,
    page: 1,
    pageSize: 100,
  });
  const pages = pagesQuery.data?.rows ?? [];

  const setStatusMutation = useSetCmsPageStatus();
  const duplicateMutation = useDuplicateCmsPage();
  const deleteMutation = useDeleteCmsPage();

  function togglePublish(page: CmsPageListItem) {
    const nextStatus: CmsPageStatus = page.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setStatusMutation.mutate(
      { id: page.id, status: nextStatus },
      {
        onSuccess: () =>
          toast.success(
            nextStatus === "PUBLISHED"
              ? `"${page.title}" published`
              : `"${page.title}" unpublished`,
          ),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Failed to update page status"),
      },
    );
  }

  function duplicate(page: CmsPageListItem) {
    duplicateMutation.mutate(page.id, {
      onSuccess: (created) => toast.success(`"${page.title}" duplicated as "${created.title}"`),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Failed to duplicate page"),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`"${deleteTarget.title}" deleted`);
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete page");
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search pages by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setEditorState({ pageId: null, initialTab: "edit" })}>
            <Plus className="size-4" />
            New Page
          </Button>
        </CardContent>
      </Card>

      {pagesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No pages found"
          description="Try adjusting your search or status filter, or create a new page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pages.map((page, i) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setEditorState({ pageId: page.id, initialTab: "edit" })}
              className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-foreground">{page.title}</h3>
                  <span className="font-mono text-xs text-muted-foreground">{page.publicUrl}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusPill status={page.status.toLowerCase()} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={() => setEditorState({ pageId: page.id, initialTab: "edit" })}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditorState({ pageId: page.id, initialTab: "preview" })}
                      >
                        <ExternalLink className="size-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePublish(page)}>
                        <FileText className="size-4" />
                        {page.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(page)}>
                        <Copy className="size-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(page)}>
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <span className="text-xs text-muted-foreground">
                  Updated {formatDateTime(page.updatedAt)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditorState({ pageId: page.id, initialTab: "edit" });
                  }}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {editorState && (
        <CmsPageEditorDialog
          open={editorState !== null}
          onOpenChange={(open) => !open && setEditorState(null)}
          appType={appType}
          pageId={editorState.pageId}
          initialTab={editorState.initialTab}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this page?"
        description={
          deleteTarget
            ? `This will permanently delete "${deleteTarget.title}" (${deleteTarget.publicUrl}). This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Page"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export { CmsPagesList };
