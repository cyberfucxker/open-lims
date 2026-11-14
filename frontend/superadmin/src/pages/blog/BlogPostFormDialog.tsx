import { useEffect, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveUploadUrl } from "@/services/api/httpClient";
import { useCreateBlogPost, useUpdateBlogPost } from "@/hooks/queries/useBlogPosts";
import {
  uploadBlogPostImageApi,
  type BlogPostDto,
  type BlogPostFormValues,
  type BlogPostStatus,
} from "@/services/api/blogPostApi";

interface BlogPostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPostDto | null;
}

interface FormState {
  title: string;
  slug: string;
  category: string;
  readMinutes: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  status: BlogPostStatus;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  category: "",
  readMinutes: "2",
  excerpt: "",
  body: "",
  imageUrl: "",
  status: "DRAFT",
};

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function BlogPostFormDialog({ open, onOpenChange, post }: BlogPostFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  // Once the admin edits the slug by hand, title changes stop overwriting
  // it — otherwise fixing a typo in the title would silently break a link
  // already shared from an earlier save.
  const [slugTouched, setSlugTouched] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const isSaving = createPost.isPending || updatePost.isPending;

  useEffect(() => {
    if (!open) return;
    if (post) {
      setForm({
        title: post.title,
        slug: post.slug,
        category: post.category,
        readMinutes: String(post.readMinutes),
        excerpt: post.excerpt,
        body: post.body.join("\n\n"),
        imageUrl: post.imageUrl ?? "",
        status: post.status,
      });
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
  }, [open, post]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadBlogPostImageApi(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit() {
    const title = form.title.trim();
    const slug = form.slug.trim();
    const category = form.category.trim();
    const excerpt = form.excerpt.trim();
    const body = form.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const readMinutes = Number(form.readMinutes);

    if (!title) return toast.error("Enter a title.");
    if (!slug) return toast.error("Enter a slug.");
    if (!category) return toast.error("Enter a category.");
    if (!excerpt) return toast.error("Enter an excerpt.");
    if (body.length === 0) return toast.error("Add at least one paragraph.");
    if (!Number.isFinite(readMinutes) || readMinutes < 1) {
      return toast.error("Enter a valid read time.");
    }

    const values: BlogPostFormValues = {
      title,
      slug,
      category,
      excerpt,
      body,
      readMinutes,
      imageUrl: form.imageUrl.trim() || null,
      status: form.status,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(post ? "Article updated." : "Article created.");
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (post) {
      updatePost.mutate({ id: post.id, values }, onSettled);
    } else {
      createPost.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Article" : "New Article"}</DialogTitle>
          <DialogDescription>
            Shows on patient-web's <strong>/blog</strong> once <strong>Published</strong> — a{" "}
            <strong>Draft</strong> is saved but not visible to patients yet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bp-title">Title *</Label>
            <Input
              id="bp-title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: slugTouched ? f.slug : slugify(title),
                }));
              }}
              placeholder="Blood Test Positive for Pregnancy: What the Result Actually Tells You"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bp-slug">Slug *</Label>
            <Input
              id="bp-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
              }}
              placeholder="blood-test-positive-for-pregnancy"
              maxLength={200}
            />
            <span className="text-xs text-muted-foreground">
              The article's URL: /blog/{form.slug || "..."}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bp-category">Category *</Label>
              <Input
                id="bp-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Pathology"
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bp-read-minutes">Read time (min) *</Label>
              <Input
                id="bp-read-minutes"
                type="number"
                min={1}
                max={60}
                value={form.readMinutes}
                onChange={(e) => setForm((f) => ({ ...f, readMinutes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bp-excerpt">Excerpt *</Label>
            <Textarea
              id="bp-excerpt"
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="A one- to two-sentence summary shown on the blog list card."
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bp-body">Body *</Label>
            <Textarea
              id="bp-body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder={"First paragraph.\n\nSecond paragraph.\n\nThird paragraph."}
              rows={10}
            />
            <span className="text-xs text-muted-foreground">
              One paragraph per line, separated by a blank line.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cover Photo</Label>
            <div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
              {form.imageUrl ? (
                <img
                  src={resolveUploadUrl(form.imageUrl)}
                  alt="Article cover preview"
                  className="size-full object-cover"
                />
              ) : (
                <ImageUp className="size-6 text-muted-foreground" />
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : form.imageUrl ? "Replace Photo" : "Upload Photo"}
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bp-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v as BlogPostStatus }))}
            >
              <SelectTrigger id="bp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft — not visible to patients</SelectItem>
                <SelectItem value="PUBLISHED">Published — live on /blog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
            {isSaving ? "Saving..." : post ? "Save Changes" : "Create Article"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { BlogPostFormDialog };
