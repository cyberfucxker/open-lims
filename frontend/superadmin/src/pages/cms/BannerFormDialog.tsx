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
import { useCreateBanner, useUpdateBanner } from "@/hooks/queries/useBanners";
import {
  uploadBannerImageApi,
  type BannerDto,
  type BannerFormValues,
} from "@/services/api/bannerApi";

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: BannerDto | null;
}

interface FormState {
  imageUrl: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { imageUrl: "", validFrom: "", validUntil: "", isActive: true };

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function BannerFormDialog({ open, onOpenChange, banner }: BannerFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const isSaving = createBanner.isPending || updateBanner.isPending;

  useEffect(() => {
    if (!open) return;
    if (banner) {
      setForm({
        imageUrl: banner.imageUrl,
        validFrom: toDateInputValue(banner.validFrom),
        validUntil: toDateInputValue(banner.validUntil),
        isActive: banner.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, banner]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadBannerImageApi(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit() {
    if (!form.imageUrl.trim()) {
      toast.error("Upload a banner image.");
      return;
    }
    if (form.validFrom && form.validUntil && new Date(form.validUntil) < new Date(form.validFrom)) {
      toast.error("Valid-until date must be on or after valid-from.");
      return;
    }

    const values: BannerFormValues = {
      imageUrl: form.imageUrl.trim(),
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      isActive: form.isActive,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(banner ? "Banner updated." : "Banner added.");
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (banner) {
      updateBanner.mutate({ id: banner.id, values }, onSettled);
    } else {
      createBanner.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Add Banner"}</DialogTitle>
          <DialogDescription>
            Configure a home-screen banner slide shown in the Example Lab patient app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Banner Image *</Label>
            <p className="text-xs text-muted-foreground">
              Recommended size <strong>1200 × 400px</strong> (3:1 ratio) — the app slider crops to
              this same ratio on every screen, so an image already in this ratio won't lose any
              content on phone or laptop.
            </p>
            {/* Same aspect-[3/1] + object-cover as the patient-web BannerCarousel slide, so this
                preview shows admins the exact crop patients will see. */}
            <div className="flex aspect-[3/1] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
              {form.imageUrl ? (
                <img
                  src={resolveUploadUrl(form.imageUrl)}
                  alt="Banner preview"
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
              {isUploading ? "Uploading..." : form.imageUrl ? "Replace Image" : "Upload Image"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banner-valid-from">Valid From</Label>
              <Input
                id="banner-valid-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banner-valid-until">Valid Until</Label>
              <Input
                id="banner-valid-until"
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Active</span>
              <span className="text-xs text-muted-foreground">
                Show this banner in the app slider
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
          <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
            {isSaving ? "Saving..." : banner ? "Save Changes" : "Add Banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { BannerFormDialog };
