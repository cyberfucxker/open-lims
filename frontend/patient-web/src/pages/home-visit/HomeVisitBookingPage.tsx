import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Building2,
  HeartPulse,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddFamilyMemberSheet } from "@/components/family/AddFamilyMemberSheet";
import { AddressFormSheet } from "@/components/address/AddressFormSheet";
import { DatePickerStrip } from "@/components/slot/DatePickerStrip";
import { SlotGrid } from "@/components/slot/SlotGrid";
import { SlotSkeleton } from "@/components/slot/SlotSkeleton";
import { useFamilyMembers } from "@/hooks/queries/useProfile";
import { useAddresses } from "@/hooks/queries/useAddress";
import { useLabDetail } from "@/hooks/queries/useNearbyLabs";
import { useSlotAvailability } from "@/hooks/queries/useSlot";
import { useCreateHomeVisit } from "@/hooks/queries/useOrders";
import { EASE_OUT_EXPO } from "@/utils/motion";
import type { SlotItem } from "@/types";

const homeVisitSchema = z.object({
  family_member_id: z.string().min(1, "Please select who this visit is for"),
  address_id: z.string().min(1, "Please select an address"),
  symptom_notes: z
    .string()
    .trim()
    .min(3, "Tell us what's wrong in a few words")
    .max(1000, "Keep it under 1000 characters"),
});

type HomeVisitFormValues = z.infer<typeof homeVisitSchema>;

function HomeVisitBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Set when arriving via "Book Now" on a specific "Nearest Lab" card — this
  // booking routes to that lab's franchise dashboard (see
  // `franchiseOrderScope`) regardless of the address's own area/city.
  const labId = searchParams.get("labId") || undefined;
  const { data: lab } = useLabDetail(labId);
  const { data: familyData, isLoading: familyLoading } = useFamilyMembers();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createHomeVisit = useCreateHomeVisit();

  const [date, setDate] = useState<Date>(new Date());
  const [slotId, setSlotId] = useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HomeVisitFormValues>({
    resolver: zodResolver(homeVisitSchema),
    defaultValues: { family_member_id: "", address_id: "", symptom_notes: "" },
  });

  const addressId = watch("address_id") || null;
  const dateStr = format(date, "yyyy-MM-dd");
  const { data: slotData, isLoading: slotsLoading } = useSlotAvailability(dateStr, addressId);

  const openSlots = useMemo(() => slotData?.slots.filter((s) => !s.isBlocked) ?? [], [slotData]);

  const handleSlotSelect = (slot: SlotItem) => {
    if (slot.isBlocked) return;
    setSlotId(slot.slot_id);
  };

  const onSubmit = (values: HomeVisitFormValues) => {
    if (!slotId) return;
    createHomeVisit.mutate(
      { ...values, slot_id: slotId, date: dateStr, service_center_id: labId },
      {
        onSuccess: (result) => {
          navigate(`/orders/${result.order_id}`, { replace: true });
        },
      },
    );
  };

  const canSubmit = !!slotId && !createHomeVisit.isPending;

  return (
    <div className="min-h-screen pb-32">
      <PageHeader title="Book Home Visit" />

      <div className="mx-auto max-w-2xl px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="mb-5 flex items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <Stethoscope className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Not sure what test you need?
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Tell us the problem — our phlebotomist will check and decide the right tests at your
              doorstep.
            </p>
          </div>
        </motion.div>

        {lab && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Booking for</p>
              <p className="truncate text-sm font-semibold text-foreground">{lab.center_name}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>Who is this visit for?</Label>
                <button
                  type="button"
                  onClick={() => setAddMemberOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Plus className="size-3.5" />
                  Add family member
                </button>
              </div>
              <Controller
                control={control}
                name="family_member_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={familyLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select family member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyData?.family_members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.relation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.family_member_id && (
                <p className="text-xs text-destructive">{errors.family_member_id.message}</p>
              )}
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="symptom-notes">What's the problem?</Label>
              <Textarea
                id="symptom-notes"
                rows={3}
                placeholder="e.g. Fever and body ache for 3 days"
                className="resize-none"
                {...register("symptom_notes")}
              />
              {errors.symptom_notes && (
                <p className="text-xs text-destructive">{errors.symptom_notes.message}</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <MapPin className="size-4" />
                </span>
                <h2 className="text-sm font-bold text-foreground">Visit address</h2>
              </div>
              <button
                type="button"
                onClick={() => setAddAddressOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <Plus className="size-3.5" />
                Add address
              </button>
            </div>
            <Controller
              control={control}
              name="address_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSlotId(null);
                  }}
                  disabled={addressesLoading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {[a.address, a.city, a.pincode].filter(Boolean).join(", ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.address_id && (
              <p className="text-xs text-destructive">{errors.address_id.message}</p>
            )}
            {!addressesLoading && (addresses?.length ?? 0) === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                No saved address yet —{" "}
                <button
                  type="button"
                  className="font-semibold text-primary underline"
                  onClick={() => setAddAddressOpen(true)}
                >
                  add one
                </button>{" "}
                first.
              </p>
            )}
          </section>

          {addressId && (
            <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-foreground">When should we visit?</h2>
              <DatePickerStrip
                selectedDate={date}
                onSelect={(d) => {
                  setDate(d);
                  setSlotId(null);
                }}
              />
              <div className="mt-3">
                {slotsLoading ? (
                  <SlotSkeleton />
                ) : openSlots.length > 0 ? (
                  <SlotGrid
                    slots={slotData!.slots}
                    selectedSlotId={slotId}
                    onSelect={handleSlotSelect}
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    No slots on {format(date, "d MMM")} — try another date.
                  </p>
                )}
              </div>
            </section>
          )}

          <Button type="submit" size="lg" className="h-12 w-full" disabled={!canSubmit}>
            {createHomeVisit.isPending && <Loader2 className="size-4 animate-spin" />}
            {createHomeVisit.isPending ? "Booking..." : "Book Home Visit"}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            <HeartPulse className="size-3.5 text-primary" />
            Only the visit charge is due now — the rest is fixed once tests are decided
          </p>
        </form>
      </div>

      <AddFamilyMemberSheet
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onAdded={(member) => setValue("family_member_id", member.id, { shouldValidate: true })}
      />
      <AddressFormSheet open={addAddressOpen} onOpenChange={setAddAddressOpen} />
    </div>
  );
}

export { HomeVisitBookingPage };
