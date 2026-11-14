import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
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
import { useBlogPosts, useDeleteBlogPost } from "@/hooks/queries/useBlogPosts";
import { resolveUploadUrl } from "@/services/api/httpClient";
import type { BlogPostDto, BlogPostStatus } from "@/services/api/blogPostApi";
import { formatDateTime, formatNumber } from "@/lib/format";
import { BlogPostFormDialog } from "./BlogPostFormDialog";

const PAGE_SIZE = 10;
type StatusFilter = BlogPostStatus | "all";

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Patient-web's `/blog` + `/blog/:slug` content — previously a hardcoded
 *  array shipped in the patient-web bundle; now Superadmin-authored and
 *  served from the backend, so a new article (or a fix to an existing one)
 *  no longer needs a frontend deploy. */
function BlogPostsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<BlogPostDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<BlogPostDto | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const listQuery = useBlogPosts({
    search: search || undefined,
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });
  const deletePost = useDeleteBlogPost();

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(post: BlogPostDto) {
    setEditing(post);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    deletePost.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Article deleted.");
        setDeleting(null);
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Could not delete article."),
    });
  }

  const columns: DataTableColumn<BlogPostDto>[] = useMemo(
    () => [
      {
        key: "article",
        header: "Article",
        render: (row) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
              {row.imageUrl && (
                <img
                  src={resolveUploadUrl(row.imageUrl)}
                  alt=""
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{row.title}</p>
              <p className="truncate text-xs text-muted-foreground">/blog/{row.slug}</p>
            </div>
          </div>
        ),
      },
      {
        key: "category",
        header: "Category",
        render: (row) => <span className="text-sm text-muted-foreground">{row.category}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge variant={row.status === "PUBLISHED" ? "success" : "secondary"}>
            {row.status === "PUBLISHED" ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        key: "publishedAt",
        header: "Published",
        render: (row) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {row.publishedAt ? formatDateTime(row.publishedAt) : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description="Articles shown on patient-web's /blog — write one here, publish it, and it goes live with no app deploy."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New Article
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or category..."
            className="min-w-[220px] flex-1"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
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
              : "Failed to load articles."}
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
            emptyTitle="No articles found"
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

      <BlogPostFormDialog open={formOpen} onOpenChange={setFormOpen} post={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this article?"
        description={`"${deleting?.title}" will be permanently removed and will stop showing on /blog if it was published.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export { BlogPostsPage };
