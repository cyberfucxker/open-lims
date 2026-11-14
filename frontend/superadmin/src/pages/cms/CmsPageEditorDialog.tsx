import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RichTextEditor, RICH_TEXT_CONTENT_CLASSES } from "@/components/common/RichTextEditor";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { useCmsPage, useCreateCmsPage, useUpdateCmsPage } from "@/hooks/queries/useCmsPages";
import { uploadCmsImageApi, type CmsAppType, type CmsPageStatus } from "@/services/api/cmsPageApi";

interface CmsPageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appType: CmsAppType;
  /** null = creating a brand new page. */
  pageId: string | null;
  initialTab?: "edit" | "preview";
}

function publicUrlFor(appType: CmsAppType, slug: string): string {
  const cleanSlug = slug || "your-slug";
  return appType === "PHLEBO" ? `/phlebo/${cleanSlug}` : `/${cleanSlug}`;
}

function CmsPageEditorDialog({
  open,
  onOpenChange,
  appType,
  pageId,
  initialTab = "edit",
}: CmsPageEditorDialogProps) {
  const isEditing = pageId !== null;
  const pageQuery = useCmsPage(pageId);
  const createMutation = useCreateCmsPage();
  const updateMutation = useUpdateCmsPage();

  const [tab, setTab] = useState<"edit" | "preview">(initialTab);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<CmsPageStatus>("DRAFT");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);

    if (isEditing && pageQuery.data) {
      const page = pageQuery.data;
      setTitle(page.title);
      setSlug(page.slug);
      setContent(page.content);
      setMetaTitle(page.metaTitle ?? "");
      setMetaDescription(page.metaDescription ?? "");
      setStatus(page.status);
      setUpdatedAt(page.updatedAt);
    } else if (!isEditing) {
      setTitle("");
      setSlug("");
      setContent("");
      setMetaTitle("");
      setMetaDescription("");
      setStatus("DRAFT");
      setUpdatedAt(null);
    }
  }, [open, isEditing, pageQuery.data, initialTab]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function persist(nextStatus: CmsPageStatus) {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!content.trim()) {
      toast.error("Page content is required.");
      return;
    }

    const values = {
      appType,
      title: title.trim(),
      slug: slug.trim() || undefined,
      content,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      status: nextStatus,
    };

    const onSuccess = (savedTitle: string) => {
      toast.success(
        nextStatus === "PUBLISHED"
          ? `"${savedTitle}" is now live`
          : `"${savedTitle}" saved as draft`,
      );
      onOpenChange(false);
    };
    const onError = (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to save page");
    };

    if (isEditing && pageId) {
      updateMutation.mutate(
        { id: pageId, values },
        { onSuccess: () => onSuccess(values.title), onError },
      );
    } else {
      createMutation.mutate(values, { onSuccess: () => onSuccess(values.title), onError });
    }
  }

  const loadingDetail = isEditing && pageQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle>{isEditing ? "Edit Page" : "New Page"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update content, then save as draft or publish."
                  : `Create a new ${appType === "PHLEBO" ? "Phlebo App" : "User App"} page.`}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={status.toLowerCase()} />
              {updatedAt && (
                <span className="text-xs text-muted-foreground">
                  Updated {formatDateTime(updatedAt)}
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {loadingDetail ? (
          <div className="flex flex-col gap-4 px-6 py-5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "edit" | "preview")}
            className="flex-1 overflow-hidden"
          >
            <div className="border-b border-border px-6 pt-3">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="mt-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="page-title">Title</Label>
                  <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="page-slug">Slug</Label>
                  <Input
                    id="page-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={title ? undefined : "auto-generated from title"}
                    className="font-mono"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {publicUrlFor(appType, slug)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="page-meta-title">SEO Meta Title</Label>
                  <Input
                    id="page-meta-title"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="page-meta-description">Meta Description</Label>
                  <Textarea
                    id="page-meta-description"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={300}
                    rows={1}
                    className="min-h-9 resize-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-1.5">
                <Label>Content</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  onUploadImage={uploadCmsImageApi}
                  placeholder="Write the page content…"
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Search result preview</p>
                  <p className="mt-1 truncate text-sm font-medium text-primary">
                    {metaTitle || title || "Untitled page"}
                  </p>
                  <p className="truncate text-xs text-success">
                    example.com{publicUrlFor(appType, slug)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {metaDescription || "No meta description set."}
                  </p>
                </div>

                <div
                  className={RICH_TEXT_CONTENT_CLASSES}
                  // Page content is expected to be self-contained (every seeded/authored
                  // page opens with its own `<h1>`) — no synthetic title heading here.
                  dangerouslySetInnerHTML={{
                    __html: content || "<p>Nothing to preview yet.</p>",
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" disabled={isSaving} onClick={() => persist("DRAFT")}>
            Save as Draft
          </Button>
          <Button disabled={isSaving} onClick={() => persist("PUBLISHED")}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CmsPageEditorDialog };
