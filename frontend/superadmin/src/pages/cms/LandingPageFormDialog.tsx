import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImageUp, X } from "lucide-react";
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
import { useCityList } from "@/hooks/queries/useCityMaster";
import { useSaveLandingPage } from "@/hooks/queries/useLandingPages";
import { usePackages } from "@/hooks/queries/usePackages";
import { resolveUploadUrl } from "@/services/api/httpClient";
import {
  landingPageUrl,
  uploadLandingBannerApi,
  type LandingPageDto,
} from "@/services/api/landingPageApi";
import { MultiSelect } from "@/pages/tests-packages/MultiSelect";

interface LandingPageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: LandingPageDto | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `<input type="datetime-local">` speaks local wall-clock time without a zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY = {
  name: "",
  slug: "",
  title: "",
  cityId: "",
  packageIds: [] as string[],
  desktopBannerUrl: null as string | null,
  mobileBannerUrl: null as string | null,
  validFrom: "",
  validTo: "",
  isActive: true,
};

function BannerUpload({
  label,
  hint,
  aspect,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  aspect: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadLandingBannerApi(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div
        className={`flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40 ${aspect}`}
      >
        {value ? (
          <img
            src={resolveUploadUrl(value)}
            alt={`${label} preview`}
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
        onChange={handleFile}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function LandingPageFormDialog({ open, onOpenChange, page }: LandingPageFormDialogProps) {
  const save = useSaveLandingPage();
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  // The cities endpoint caps pageSize at 100 (there are ~70 active cities).
  const { data: cities } = useCityList({ active: "true", pageSize: 100 });
  const { data: packages } = usePackages({ active: true, pageSize: 500 });

  useEffect(() => {
    if (!open) return;
    if (page) {
      setForm({
        name: page.name,
        slug: page.slug,
        title: page.title,
        cityId: page.city.id,
        packageIds: page.packages.map((p) => p.id),
        desktopBannerUrl: page.desktopBannerUrl,
        mobileBannerUrl: page.mobileBannerUrl,
        validFrom: toLocalInput(page.validFrom),
        validTo: toLocalInput(page.validTo),
        isActive: page.isActive,
      });
      setSlugTouched(true);
    } else {
      setForm(EMPTY);
      setSlugTouched(false);
    }
  }, [open, page]);

  const packageOptions = (packages?.rows ?? []).map((p) => ({ value: p.id, label: p.name }));
  const packageName = new Map([
    ...(page?.packages ?? []).map((p) => [p.id, p.name] as const),
    ...packageOptions.map((o) => [o.value, o.label] as const),
  ]);
  const slug = slugTouched ? slugify(form.slug) : slugify(form.name);

  function move(index: number, by: number) {
    setForm((f) => {
      const ids = [...f.packageIds];
      const [item] = ids.splice(index, 1);
      ids.splice(index + by, 0, item);
      return { ...f, packageIds: ids };
    });
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.title.trim() || !form.cityId || form.packageIds.length === 0) {
      toast.error("Name, title, city and at least one package are required.");
      return;
    }
    if (!form.validFrom || !form.validTo) {
      toast.error("Set the start and end of the offer.");
      return;
    }
    if (!form.desktopBannerUrl || !form.mobileBannerUrl) {
      toast.error("Upload both the desktop and the mobile banner.");
      return;
    }
    save.mutate(
      {
        id: page?.id,
        values: {
          name: form.name.trim(),
          slug,
          title: form.title.trim(),
          cityId: form.cityId,
          packageIds: form.packageIds,
          desktopBannerUrl: form.desktopBannerUrl,
          mobileBannerUrl: form.mobileBannerUrl,
          validFrom: new Date(form.validFrom).toISOString(),
          validTo: new Date(form.validTo).toISOString(),
          isActive: form.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(page ? "Landing page saved." : "Landing page created.");
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not save the landing page."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{page ? "Edit landing page" : "New landing page"}</DialogTitle>
          <DialogDescription>
            An ad landing page on the website. Only the title, city, packages and banners change —
            the rest of the page is a fixed design.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-name">Name (internal)</Label>
              <Input
                id="lp-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jaipur Full Body – Diwali ads"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-slug">Slug</Label>
              <Input
                id="lp-slug"
                className="font-mono"
                value={slugTouched ? form.slug : slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                placeholder="jaipur-full-body"
              />
              <p className="truncate text-xs text-muted-foreground">
                {slug ? landingPageUrl(slug) : " "}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lp-title">Page title</Label>
            <Input
              id="lp-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Full body checkup at home in Jaipur"
            />
            <p className="text-xs text-muted-foreground">The main heading under the banner.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>City</Label>
              <Select
                value={form.cityId}
                onValueChange={(cityId) => setForm((f) => ({ ...f, cityId }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {(cities?.rows ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-from">Starts</Label>
              <Input
                id="lp-from"
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-to">Ends</Label>
              <Input
                id="lp-to"
                type="datetime-local"
                value={form.validTo}
                onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Packages</Label>
            <MultiSelect
              options={packageOptions}
              selected={form.packageIds}
              onChange={(packageIds) => setForm((f) => ({ ...f, packageIds }))}
              placeholder="Add packages"
              hideChips
            />
            {form.packageIds.length > 0 && (
              <ol className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {form.packageIds.map((id, index) => (
                  <li key={id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="w-5 text-xs text-muted-foreground tabular-nums">
                      {index + 1}.
                    </span>
                    <span className="flex-1 truncate">{packageName.get(id) ?? "Package"}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === form.packageIds.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm((f) => ({ ...f, packageIds: f.packageIds.filter((p) => p !== id) }))
                      }
                      aria-label="Remove"
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ol>
            )}
            <p className="text-xs text-muted-foreground">
              Shown in this order, with the same prices as the website.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[3fr_2fr]">
            <BannerUpload
              label="Desktop banner"
              hint="1920 × 640 px. Shown full width, half the screen tall — keep text and faces near the centre."
              aspect="aspect-[3/1]"
              value={form.desktopBannerUrl}
              onChange={(desktopBannerUrl) => setForm((f) => ({ ...f, desktopBannerUrl }))}
            />
            <BannerUpload
              label="Mobile banner"
              hint="1080 × 1080 px. Shown full width on phones."
              aspect="aspect-square"
              value={form.mobileBannerUrl}
              onChange={(mobileBannerUrl) => setForm((f) => ({ ...f, mobileBannerUrl }))}
            />
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.isActive}
              onCheckedChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
            />
            Active
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending}>
            {save.isPending ? "Saving..." : page ? "Save changes" : "Create landing page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { LandingPageFormDialog };
