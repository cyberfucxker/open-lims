import { useEffect, useMemo, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { resolveUploadUrl } from "@/services/api/httpClient";
import { usePackages } from "@/hooks/queries/usePackages";
import { useCreateWebBanner, useUpdateWebBanner } from "@/hooks/queries/useWebBanners";
import {
  uploadWebBannerImageApi,
  type WebBannerDto,
  type WebBannerFormValues,
  type WebBannerPlacement,
} from "@/services/api/webBannerApi";

interface WebBannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: WebBannerDto | null;
}

interface FormState {
  placement: WebBannerPlacement;
  badge: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  packageId: string;
  linkUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  placement: "HOME",
  badge: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  packageId: "",
  linkUrl: "",
  isActive: true,
};

/** The Select can't hold "" as a real option value, so the no-package choice
 *  gets its own sentinel and is mapped back to null on save. */
const NO_PACKAGE = "__none__";

function WebBannerFormDialog({ open, onOpenChange, banner }: WebBannerFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: packageData } = usePackages({ active: true, page: 1, pageSize: 200 });
  const packages = useMemo(() => packageData?.rows ?? [], [packageData]);

  const isCity = form.placement === "CITY";

  const createBanner = useCreateWebBanner();
  const updateBanner = useUpdateWebBanner();
  const isSaving = createBanner.isPending || updateBanner.isPending;

  useEffect(() => {
    if (!open) return;
    if (banner) {
      setForm({
        placement: banner.placement,
        badge: banner.badge ?? "",
        title: banner.title ?? "",
        subtitle: banner.subtitle ?? "",
        imageUrl: banner.imageUrl,
        packageId: banner.packageId ?? "",
        linkUrl: banner.linkUrl ?? "",
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
      const url = await uploadWebBannerImageApi(file);
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
    // Only a city slide renders the copy, so only a city slide requires it.
    if (isCity && !form.title.trim()) {
      toast.error("Enter a title.");
      return;
    }

    // A home banner is sent as artwork and nothing else: whatever was typed
    // into the copy fields before the placement was switched is dropped here
    // rather than saved somewhere it will never be shown.
    const values: WebBannerFormValues = isCity
      ? {
          placement: "CITY",
          badge: form.badge.trim() || null,
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          imageUrl: form.imageUrl.trim(),
          packageId: form.packageId || null,
          linkUrl: form.packageId ? null : form.linkUrl.trim() || null,
          isActive: form.isActive,
        }
      : {
          placement: "HOME",
          badge: null,
          title: null,
          subtitle: null,
          imageUrl: form.imageUrl.trim(),
          packageId: null,
          linkUrl: form.linkUrl.trim() || null,
          isActive: form.isActive,
        };

    const onSettled = {
      onSuccess: () => {
        toast.success(banner ? "Web banner updated." : "Web banner added.");
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
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Web Banner" : "Add Web Banner"}</DialogTitle>
          <DialogDescription>
            A slide in one of the website's two mastheads. A <strong>Home</strong> banner is artwork
            only — the home hero draws its own heading, search box and buttons over it. A{" "}
            <strong>City</strong> banner carries copy, and attaching a package pulls that package's
            live price, discount and parameter count per city — never typed here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* First field on purpose: it decides which of the others exist. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wb-placement">Shows on *</Label>
            <Select
              value={form.placement}
              onValueChange={(v) => setForm((f) => ({ ...f, placement: v as WebBannerPlacement }))}
            >
              <SelectTrigger id="wb-placement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOME">Home page — image only</SelectItem>
                <SelectItem value="CITY">City pages — image with copy</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              The two mastheads keep separate lists, so a home slide never appears on a city page
              and the other way round.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Banner Image *</Label>
            <p className="text-xs text-muted-foreground">
              Recommended <strong>1600 × 640px</strong>.{" "}
              {isCity
                ? "The copy sits over the left half on desktop, so keep faces and products to the right side of the frame."
                : "The heading, search box and buttons sit over the left half, so keep faces and products to the right side of the frame."}
            </p>
            <div className="flex aspect-[5/2] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
              {form.imageUrl ? (
                <img
                  src={resolveUploadUrl(form.imageUrl)}
                  alt="Web banner preview"
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

          {/* Copy and the promoted package belong to a city slide only — a
              home banner has no text layer of its own to put them in. */}
          {isCity && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wb-badge">Badge</Label>
                  <Input
                    id="wb-badge"
                    value={form.badge}
                    onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                    placeholder="CARE+"
                    maxLength={40}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wb-title">Title *</Label>
                  <Input
                    id="wb-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Senior Citizen Care"
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wb-subtitle">Subtitle</Label>
                <Input
                  id="wb-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Heart, kidney and bone health, tracked"
                  maxLength={200}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wb-package">Promoted Package</Label>
                <Select
                  value={form.packageId || NO_PACKAGE}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, packageId: v === NO_PACKAGE ? "" : v }))
                  }
                >
                  <SelectTrigger id="wb-package">
                    <SelectValue placeholder="No package — promo slide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PACKAGE}>No package — promo slide</SelectItem>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  Price, MRP, discount and parameter count come from this package, per city. Leave
                  it unset for a promo slide with no price.
                </span>
              </div>
            </>
          )}

          {(!isCity || !form.packageId) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wb-link">Link</Label>
              <Input
                id="wb-link"
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="/tests"
                maxLength={300}
              />
              <span className="text-xs text-muted-foreground">
                {isCity
                  ? "Where the slide leads. Only used when no package is attached — otherwise it goes to the package's own page."
                  : "Where the artwork leads when tapped. Leave it empty for a slide that is purely decorative."}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Active</span>
              <span className="text-xs text-muted-foreground">
                Show this slide in the website hero carousel
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

export { WebBannerFormDialog };
