import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, HelpCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteHomeFaq,
  useHomeFaqs,
  useReorderHomeFaqs,
  useSetHomeFaqStatus,
} from "@/hooks/queries/useHomeFaqs";
import { useHomeSeoContent, useUpdateHomeSeoContent } from "@/hooks/queries/useHomeSeoContent";
import type { HomeFaqDto } from "@/services/api/homeFaqApi";
import { cn } from "@/utils/cn";

import { HomeFaqFormDialog } from "./HomeFaqFormDialog";

type ActiveFilter = "all" | "active" | "inactive";

function HomeSeoContentCard() {
  const { data, isLoading } = useHomeSeoContent();
  const updateContent = useUpdateHomeSeoContent();

  const [heading, setHeading] = useState("");
  const [contentBody, setContentBody] = useState("");

  useEffect(() => {
    if (!data) return;
    setHeading(data.heading);
    setContentBody(data.body);
  }, [data]);

  const isDirty = data ? heading !== data.heading || contentBody !== data.body : false;

  function handleSave() {
    if (!heading.trim()) {
      toast.error("Enter a heading.");
      return;
    }
    if (!contentBody.trim()) {
      toast.error("Enter the body content.");
      return;
    }
    updateContent.mutate(
      { heading: heading.trim(), body: contentBody.trim() },
      {
        onSuccess: () => toast.success("Home SEO content updated."),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update SEO content."),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Home Page SEO Content</CardTitle>
        <CardDescription>
          The rich-text intro block shown near the bottom of the patient app's Home page, mainly for
          SEO. HTML is allowed in the body. Use the literal token <code>{"{city}"}</code> anywhere
          to have it replaced with the patient's selected city.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seo-heading">Heading</Label>
              <Input
                id="seo-heading"
                value={heading}
                maxLength={200}
                onChange={(e) => setHeading(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seo-body">Body (HTML)</Label>
              <Textarea
                id="seo-body"
                rows={8}
                value={contentBody}
                onChange={(e) => setContentBody(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateContent.isPending}
              className="self-start"
            >
              {updateContent.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HomeFaqsTab() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<HomeFaqDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeFaqDto | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useHomeFaqs({
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    page: 1,
    pageSize: 100,
  });
  const faqs = useMemo(() => data?.rows ?? [], [data]);

  const setStatus = useSetHomeFaqStatus();
  const deleteFaq = useDeleteHomeFaq();
  const reorder = useReorderHomeFaqs();

  const canReorder = activeFilter === "all";

  function openAddDialog() {
    setEditingFaq(null);
    setFormOpen(true);
  }

  function openEditDialog(faq: HomeFaqDto) {
    setEditingFaq(faq);
    setFormOpen(true);
  }

  function handleToggleActive(faq: HomeFaqDto, isActive: boolean) {
    setStatus.mutate(
      { id: faq.id, isActive },
      {
        onSuccess: () => toast.success(isActive ? "FAQ is now active" : "FAQ was deactivated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update FAQ status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteFaq.mutate(target.id, {
      onSuccess: () => {
        toast.success("FAQ was removed");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete FAQ.");
        setDeleteTarget(null);
      },
    });
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex || !canReorder) {
      setDragIndex(null);
      return;
    }
    const reordered = [...faqs];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    reorder.mutate(
      reordered.map((f) => f.id),
      {
        onSuccess: () => toast.success("FAQ order updated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to reorder FAQs."),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <HomeSeoContentCard />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All FAQs</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            Add FAQ
          </Button>
        </CardContent>
      </Card>

      {!canReorder && (
        <p className="text-xs text-muted-foreground">
          Clear the status filter to drag and reorder FAQs.
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
          icon={HelpCircle}
          title="Couldn't load FAQs"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : faqs.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No FAQs found"
          description="Try a different filter, or add a new FAQ to the Home page accordion."
          action={
            <Button onClick={openAddDialog} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add FAQ
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              draggable={canReorder}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow sm:flex-row sm:items-start",
                canReorder && "hover:shadow-md",
                dragIndex === i && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex items-center pt-0.5 text-muted-foreground sm:pt-1",
                  canReorder ? "cursor-grab active:cursor-grabbing" : "opacity-30",
                )}
              >
                <GripVertical className="size-5" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium text-foreground">{faq.question}</span>
                <span className="text-sm text-muted-foreground">{faq.answer}</span>
              </div>

              <div className="flex items-center gap-4 sm:gap-5">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(faq)}>
                  Edit
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={faq.isActive}
                    onCheckedChange={(checked) => handleToggleActive(faq, checked)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(faq)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <HomeFaqFormDialog open={formOpen} onOpenChange={setFormOpen} faq={editingFaq} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete FAQ?"
        description="This FAQ will be removed from the Home page accordion. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { HomeFaqsTab };
