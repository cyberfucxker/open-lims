import { Suspense, lazy, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateCenter, useUpdateCenter } from "@/hooks/queries/useCenters";
import { useOrganizations } from "@/hooks/queries/useOrganizations";
import {
  CENTER_TYPES,
  toCenterTypeCode,
  type DiagnosticCenter,
  type DiagnosticCenterFormValues,
} from "@/services/api/serviceCenterApi";

/** Sentinel for the Select — an empty string isn't a valid Radix Select
 *  item value, and this reads better than a magic id. */
const NO_FRANCHISE = "none";

/** Lazy because it pulls in Leaflet (~150 kB), and this dialog is the only
 *  place in the whole admin that renders a map — a static import would put
 *  that in the eagerly-loaded vendor chunk every page pays for. It loads
 *  when this dialog opens, well before anya single clicks "Pick location". */
const CenterLocationPicker = lazy(() =>
  import("@/pages/centers/CenterLocationPicker").then((m) => ({
    default: m.CenterLocationPicker,
  })),
);

interface CenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: DiagnosticCenter | null;
}

interface FormState {
  name: string;
  address: string;
  imageUrl: string;
  phone: string;
  email: string;
  website: string;
  latitude: string;
  longitude: string;
  rating: string;
  reviewCount: string;
  openingTime: string;
  closingTime: string;
  centerType: string;
  isActive: boolean;
  facilities: string;
  paymentMethods: string;
  organizationId: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  address: "",
  imageUrl: "",
  phone: "",
  email: "",
  website: "",
  latitude: "",
  longitude: "",
  rating: "",
  reviewCount: "",
  openingTime: "",
  closingTime: "",
  centerType: "COLLECTION_CENTER",
  isActive: true,
  facilities: "",
  paymentMethods: "",
  organizationId: NO_FRANCHISE,
};

function toCsv(values: string[]): string {
  return values.join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function CenterFormDialog({ open, onOpenChange, center }: CenterFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createCenter = useCreateCenter();
  const updateCenter = useUpdateCenter();
  const isSaving = createCenter.isPending || updateCenter.isPending;

  const franchisesQuery = useOrganizations({ active: "true", pageSize: 200 });
  const franchises = franchisesQuery.data?.rows ?? [];

  useEffect(() => {
    if (!open) return;
    if (center) {
      setForm({
        name: center.name,
        address: center.address,
        imageUrl: center.imageUrl ?? "",
        phone: center.phone ?? "",
        email: center.email ?? "",
        website: center.website ?? "",
        latitude: String(center.latitude),
        longitude: String(center.longitude),
        // Kept as strings so an empty box stays empty instead of showing a
        // "0" the admin has to delete before typing. Blank submits as 0.
        rating: center.rating ? String(center.rating) : "",
        reviewCount: center.reviewCount ? String(center.reviewCount) : "",
        openingTime: center.openingTime ?? "",
        closingTime: center.closingTime ?? "",
        centerType: toCenterTypeCode(center.centerType),
        isActive: center.isActive,
        facilities: toCsv(center.facilities),
        paymentMethods: toCsv(center.paymentMethods),
        organizationId: center.organizationId ?? NO_FRANCHISE,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, center]);

  const isValid =
    form.name.trim().length > 0 &&
    form.address.trim().length > 0 &&
    form.latitude.trim().length > 0 &&
    form.longitude.trim().length > 0 &&
    Number(form.latitude) >= -90 &&
    Number(form.latitude) <= 90 &&
    Number(form.longitude) >= -180 &&
    Number(form.longitude) <= 180 &&
    // Blank is fine (submits as 0); a typed value has to be a real 0–5 star
    // rating, matching the backend's own bound.
    (form.rating.trim() === "" ||
      (Number.isFinite(Number(form.rating)) &&
        Number(form.rating) >= 0 &&
        Number(form.rating) <= 5)) &&
    (form.reviewCount.trim() === "" ||
      (Number.isInteger(Number(form.reviewCount)) && Number(form.reviewCount) >= 0));

  function handleSubmit() {
    if (!isValid) {
      toast.error("Fill all required fields with valid coordinates before saving.");
      return;
    }
    const values: DiagnosticCenterFormValues = {
      name: form.name.trim(),
      address: form.address.trim(),
      imageUrl: form.imageUrl.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      rating: form.rating.trim() === "" ? 0 : Number(form.rating),
      reviewCount: form.reviewCount.trim() === "" ? 0 : Number(form.reviewCount),
      openingTime: form.openingTime.trim() || null,
      closingTime: form.closingTime.trim() || null,
      centerType: form.centerType.trim() || null,
      isActive: form.isActive,
      facilities: fromCsv(form.facilities),
      paymentMethods: fromCsv(form.paymentMethods),
      organizationId: form.organizationId === NO_FRANCHISE ? null : form.organizationId,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(center ? "Center updated successfully." : "Center added successfully.");
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (center) {
      updateCenter.mutate({ id: center.id, values }, onSettled);
    } else {
      createCenter.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{center ? "Edit Diagnostic Center" : "Add Diagnostic Center"}</DialogTitle>
          <DialogDescription>
            {center
              ? "Update this lab/center's details shown on the patient app's nearest-lab list."
              : "Add a new lab/center so patients can find it as a nearby diagnostic center."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="center-name">Name *</Label>
            <Input
              id="center-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Example Diagnostics Lab — Andheri"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="center-address">Address *</Label>
            <Textarea
              id="center-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Shop 4, Link Road, Andheri West, Mumbai"
              rows={2}
            />
          </div>

          <Suspense
            fallback={
              <div className="h-9 w-44 animate-pulse rounded-md bg-secondary" aria-hidden />
            }
          >
            <CenterLocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onPick={(latitude, longitude) => setForm((f) => ({ ...f, latitude, longitude }))}
              onUseAddress={(address) => setForm((f) => ({ ...f, address }))}
            />
          </Suspense>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-lat">Latitude *</Label>
              <Input
                id="center-lat"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                placeholder="19.1197"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-long">Longitude *</Label>
              <Input
                id="center-long"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                placeholder="72.8468"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-rating">Rating</Label>
              <Input
                id="center-rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                placeholder="4.5"
              />
              <span className="text-xs text-muted-foreground">
                0–5, one decimal. Shown on the patient app's lab card.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-reviews">Review Count</Label>
              <Input
                id="center-reviews"
                type="number"
                min={0}
                step={1}
                value={form.reviewCount}
                onChange={(e) => setForm((f) => ({ ...f, reviewCount: e.target.value }))}
                placeholder="128"
              />
              <span className="text-xs text-muted-foreground">
                Displayed beside the rating; leave blank to hide it.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-phone">Phone</Label>
              <Input
                id="center-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-email">Email</Label>
              <Input
                id="center-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="center@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-open">Opening Time</Label>
              <Input
                id="center-open"
                value={form.openingTime}
                onChange={(e) => setForm((f) => ({ ...f, openingTime: e.target.value }))}
                placeholder="08:00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-close">Closing Time</Label>
              <Input
                id="center-close"
                value={form.closingTime}
                onChange={(e) => setForm((f) => ({ ...f, closingTime: e.target.value }))}
                placeholder="20:00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-type">Center Type</Label>
              <Select
                value={form.centerType}
                onValueChange={(v) => setForm((f) => ({ ...f, centerType: v }))}
              >
                <SelectTrigger id="center-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CENTER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="center-website">Website</Label>
              <Input
                id="center-website"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="center-image">Image URL</Label>
            <Input
              id="center-image"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="center-facilities">Facilities</Label>
            <Input
              id="center-facilities"
              value={form.facilities}
              onChange={(e) => setForm((f) => ({ ...f, facilities: e.target.value }))}
              placeholder="Parking, Wheelchair Access, Home Collection"
            />
            <span className="text-xs text-muted-foreground">Comma-separated.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="center-payment">Payment Methods</Label>
            <Input
              id="center-payment"
              value={form.paymentMethods}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethods: e.target.value }))}
              placeholder="Cash, UPI, Card"
            />
            <span className="text-xs text-muted-foreground">Comma-separated.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="center-franchise">Franchise</Label>
            <Select
              value={form.organizationId}
              onValueChange={(v) => setForm((f) => ({ ...f, organizationId: v }))}
            >
              <SelectTrigger id="center-franchise" className="w-full">
                <SelectValue placeholder="No franchise assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FRANCHISE}>No franchise assigned</SelectItem>
                {franchises.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              A patient tapping "Book Now" on this lab's card routes their booking to this
              franchise's dashboard, regardless of the patient's own address area.
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive centers are hidden from the patient app's nearest-lab list.
              </p>
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
            {isSaving ? "Saving..." : center ? "Save Changes" : "Add Center"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CenterFormDialog };
