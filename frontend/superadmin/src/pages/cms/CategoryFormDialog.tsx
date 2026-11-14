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
import { Switch } from "@/components/ui/switch";
import { resolveUploadUrl } from "@/services/api/httpClient";
import { useCreateAppCategory, useUpdateAppCategory } from "@/hooks/queries/useAppCategories";
import {
  uploadAppCategoryImageApi,
  type AppCategoryDto,
  type AppCategoryFormValues,
} from "@/services/api/appCategoryApi";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AppCategoryDto | null;
}

interface FormState {
  name: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { name: "", imageUrl: "", isActive: true };

function ImagePickerField({
  label,
  value,
  onUploaded,
}: {
  label: string;
  value: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadAppCategoryImageApi(file);
      onUploaded(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
          {value ? (
            <img src={resolveUploadUrl(value)} alt={label} className="size-full object-cover" />
          ) : (
            <ImageUp className="size-5 text-muted-foreground" />
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
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : value ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  );
}

function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createCategory = useCreateAppCategory();
  const updateCategory = useUpdateAppCategory();
  const isSaving = createCategory.isPending || updateCategory.isPending;

  useEffect(() => {
    if (!open) return;
    if (category) {
      setForm({
        name: category.name,
        imageUrl: category.imageUrl ?? category.thumbnailUrl ?? "",
        isActive: category.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, category]);

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    const values: AppCategoryFormValues = {
      name: form.name.trim(),
      imageUrl: form.imageUrl.trim() || null,
      thumbnailUrl: form.imageUrl.trim() || null,
      isActive: form.isActive,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(category ? "Category updated." : `Category "${values.name}" created.`);
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (category) {
      updateCategory.mutate({ id: category.id, values }, onSettled);
    } else {
      createCategory.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            Configure a home-screen category tile shown in the Example Lab patient app (e.g. Salon,
            Spa, Hair Care).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-name">Name *</Label>
            <Input
              id="category-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Salon"
            />
          </div>

          <ImagePickerField
            label="Image"
            value={form.imageUrl}
            onUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          />

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Active</span>
              <span className="text-xs text-muted-foreground">
                Show this category on the home screen
              </span>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : category ? "Save Changes" : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CategoryFormDialog };
