import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Home, Loader2, MapPin } from "lucide-react";
import { z } from "zod";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddAddress, useEditAddress } from "@/hooks/queries/useAddress";
import { useBookingStore } from "@/store/bookingStore";
import { cn } from "@/utils/cn";
import type { PickedLocation } from "@/components/address/AddressMapPicker";
import type { AddressResult } from "@/types";

// Lazy-loaded: the Google Maps JS API loader + its React wrapper are a chunk
// worth deferring off the initial bundle, even though the map now shows the
// moment this sheet opens.
const AddressMapPicker = lazy(() =>
  import("@/components/address/AddressMapPicker").then((m) => ({
    default: m.AddressMapPicker,
  })),
);

/** Only what the patient actually types: the full address line (flat/house
 *  no., building, street — whatever they type) and the address type.
 *  Everything else about an address — the geocoded line, locality, city,
 *  state, pincode, latitude and longitude — comes from the map pin above
 *  these fields, so none of it is in this schema or on screen. */
const addressSchema = z.object({
  name: z.enum(["home", "work", "other"]),
  house_no: z.string().trim().min(1, "Address is required"),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAddress?: AddressResult | null;
}

function toFormValues(address?: AddressResult | null): AddressFormValues {
  return {
    name: (address?.name.toLowerCase() as AddressFormValues["name"]) ?? "home",
    house_no: address?.house_no ?? "",
  };
}

const TYPE_OPTIONS = [
  { value: "home", label: "Home", icon: Home },
  { value: "work", label: "Work", icon: Briefcase },
  { value: "other", label: "Other", icon: MapPin },
] as const;

function AddressFormSheet({ open, onOpenChange, initialAddress }: AddressFormSheetProps) {
  const addAddress = useAddAddress();
  const editAddress = useEditAddress();
  const isEdit = !!initialAddress;
  const isPending = addAddress.isPending || editAddress.isPending;
  const setBookingAddress = useBookingStore((s) => s.setAddress);

  // Null until the patient actually pins somewhere (see `AddressMapPicker`'s
  // `onChange` doc-comment). On a new address that's what gates Save; on an
  // edit it means "they didn't re-pin", and the saved location is kept.
  const [picked, setPicked] = useState<PickedLocation | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: toFormValues(initialAddress),
  });

  useEffect(() => {
    if (open) {
      reset(toFormValues(initialAddress));
      setPicked(null);
    }
  }, [open, initialAddress, reset]);

  const initialLatLng =
    initialAddress?.lat && initialAddress?.long
      ? { lat: Number(initialAddress.lat), lng: Number(initialAddress.long) }
      : null;

  // Stable identity so a keystroke in the form below never re-runs the
  // picker's effects — it holds a Leaflet map instance and a geocode queue.
  const handleLocationChange = useCallback((location: PickedLocation | null) => {
    setPicked(location);
  }, []);

  // A new address has nothing to fall back on, so it can't be saved until
  // the map resolves somewhere. An edit always can: not re-pinning simply
  // keeps the location it already had.
  const canSave = isEdit || !!picked;

  const onSubmit = (values: AddressFormValues) => {
    const typed = {
      name: values.name,
      house_no: values.house_no.trim(),
    };

    // The map is the only source of these. An edit that never re-pinned
    // sends none of them, and the backend keeps what the address already
    // had (see `address.service.ts#editAddress`).
    const location = picked
      ? {
          address: picked.addressLine || picked.displayName,
          locality: picked.locality || undefined,
          city: picked.city || undefined,
          state: picked.state || undefined,
          pincode: picked.pincode || undefined,
          lat: String(picked.lat),
          long: String(picked.lng),
        }
      : null;

    if (isEdit && initialAddress) {
      editAddress.mutate(
        { ...typed, ...(location ?? { address: initialAddress.address }), id: initialAddress.id },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    // `canSave` guarantees a location here; the guard is for the compiler.
    if (!location) return;

    // Select the address just created for the current booking — without
    // this, the previously-selected default silently stayed selected
    // (see `AddressListPage.tsx`'s own doc-comment on that effect: it
    // only re-picks when the *current* selection disappears, never on a
    // plain addition).
    addAddress.mutate(
      { ...typed, ...location },
      {
        onSuccess: (created) => {
          setBookingAddress(created.id);
          onOpenChange(false);
        },
      },
    );
  };

  const savedSummary = initialAddress
    ? [initialAddress.address, initialAddress.locality, initialAddress.city, initialAddress.pincode]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Address" : "Add New Address"}
      desktopVariant="drawer"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Suspense
          fallback={
            <div className="flex h-52 items-center justify-center rounded-xl border border-border bg-muted/40 sm:h-60">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <AddressMapPicker
            initialCenter={initialLatLng}
            initialSummary={savedSummary}
            onChange={handleLocationChange}
          />
        </Suspense>

        <div className="space-y-1.5">
          <Label htmlFor="house_no">
            Full Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="house_no"
            autoComplete="off"
            placeholder="Flat / house no., building, street, etc."
            {...register("house_no")}
            aria-invalid={!!errors.house_no}
          />
          {errors.house_no && <p className="text-xs text-destructive">{errors.house_no.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Address type</Label>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    aria-pressed={field.value === value}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      field.value === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending || !canSave}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save Address"}
        </Button>
        {!canSave && (
          <p className="text-center text-xs text-muted-foreground">
            Pin your location on the map above to continue
          </p>
        )}
      </form>
    </BottomSheet>
  );
}

export { AddressFormSheet };
