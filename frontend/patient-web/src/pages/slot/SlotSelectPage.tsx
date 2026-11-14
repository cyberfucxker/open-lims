import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarClock, CalendarX2, Clock, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { OrderSummaryCard } from "@/components/cart/OrderSummaryCard";
import { ProceedButton } from "@/components/cart/ProceedButton";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { DatePickerStrip } from "@/components/slot/DatePickerStrip";
import { SlotGrid } from "@/components/slot/SlotGrid";
import { SlotSkeleton } from "@/components/slot/SlotSkeleton";
import { useAddresses } from "@/hooks/queries/useAddress";
import { useCart } from "@/hooks/queries/useCart";
import { useSlotAvailability } from "@/hooks/queries/useSlot";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { orderApi } from "@/services/api/orderApi";
import { useBookingStore } from "@/store/bookingStore";
import type { SlotItem } from "@/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Home-collection only — the backend's slot-availability endpoint never
 *  returns center-based slots for the Patient App, so there's no
 *  collection-type toggle here (there used to be one; removed along with
 *  the "Visit a Center" tab). */
export function SlotSelectPage() {
  const navigate = useNavigate();
  const selectedAddressId = useBookingStore((s) => s.selectedAddressId);
  const selectedSlotId = useBookingStore((s) => s.selectedSlotId);
  const storeSelectedDate = useBookingStore((s) => s.selectedDate);
  const setSlot = useBookingStore((s) => s.setSlot);

  const [date, setDate] = useState<Date>(() =>
    storeSelectedDate ? new Date(storeSelectedDate) : new Date(),
  );
  // No separate Review step anymore — this page prepares the order itself
  // (same `review-cart` call that page used to make on mount) right before
  // handing off to Payment, so it needs its own in-flight/error state.
  const [submitting, setSubmitting] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");
  const { data: slotData, isLoading: slotsLoading } = useSlotAvailability(
    dateStr,
    selectedAddressId,
  );

  // Recap data for the sticky panel — both queries are already cached by the
  // cart/address steps, so this adds no extra round trips.
  const { data: addresses } = useAddresses();
  const { data: cart } = useCart();
  const collectionAddress = useMemo(
    () => addresses?.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    if (!selectedAddressId) {
      toast.error("Please select an address first");
      navigate("/addresses?select=1", { replace: true });
    }
  }, [selectedAddressId, navigate]);

  if (!selectedAddressId) return null;

  const highlightedSlotId = storeSelectedDate === dateStr ? selectedSlotId : null;

  const handleSlotSelect = (slot: SlotItem) => {
    if (slot.isBlocked) return;
    setSlot(dateStr, slot.slot_id, slot.title);
  };

  const canContinue = !!highlightedSlotId && storeSelectedDate === dateStr;

  const selectedSlotTitle =
    slotData?.slots.find((s) => s.slot_id === highlightedSlotId)?.title ?? null;
  const openSlotCount = slotData?.slots.filter((s) => !s.isBlocked).length ?? 0;
  // Only bookable slots are ever shown (see `SlotGrid.tsx`), so "any slots
  // to show" means "any *open* slot" — a date whose templates are all
  // blocked must fall through to the "No slots" empty state below, not
  // render an empty grid.
  const hasSlots = openSlotCount > 0;

  const goToPayment = async () => {
    if (!canContinue || !selectedAddressId || !highlightedSlotId || submitting) return;
    setSubmitting(true);
    try {
      const reviewed = await orderApi.reviewCart({
        address_id: selectedAddressId,
        slot_id: highlightedSlotId,
        date: dateStr,
      });
      navigate("/payment", {
        state: {
          order_id: reviewed.order_id,
          order_number: reviewed.order_number,
          // The whole breakdown, not just the total: this is the only call
          // that knows the phlebotomy charge — it needs the address's area
          // and the slot, so nothing earlier in the flow can work it out —
          // and the payment page is where the patient is asked to agree to
          // the figure.
          payment_summary: reviewed.payment_summary,
          total_payable: reviewed.payment_summary.total_payable,
        },
      });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not prepare your booking");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-10">
      <PageHeader title="Choose Slot" />

      <div className="mx-auto max-w-7xl px-4 py-4">
        <CheckoutSteps current="slot" className="mb-5" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="mb-4 flex items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-md">
            <CalendarClock className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              When should we collect?
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {slotData?.city ? `Serving ${slotData.city} · ` : ""}
              free home visit by a trained phlebotomist
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.04 }}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-sm">
                  <CalendarClock className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Select date</h2>
                  <p className="text-xs text-muted-foreground">
                    {format(date, "EEEE, d MMMM yyyy")}
                  </p>
                </div>
              </div>
              <DatePickerStrip selectedDate={date} onSelect={setDate} />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.08 }}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-sm">
                  <Clock className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-foreground">Available time slots</h2>
                  <p className="text-xs text-muted-foreground">
                    {slotsLoading
                      ? "Checking availability…"
                      : `${openSlotCount} of ${slotData?.slots.length ?? 0} slots open on this date`}
                  </p>
                </div>
              </div>

              {slotsLoading ? (
                <SlotSkeleton />
              ) : hasSlots ? (
                <SlotGrid
                  slots={slotData!.slots}
                  selectedSlotId={highlightedSlotId}
                  onSelect={handleSlotSelect}
                />
              ) : (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
                  <motion.span
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
                  >
                    <CalendarX2 className="size-6" />
                  </motion.span>
                  <p className="text-sm font-semibold text-foreground">
                    No slots for {format(date, "d MMM")}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Try another date from the strip above — availability opens up through the week.
                  </p>
                </div>
              )}
            </motion.section>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Sealed sample kit · reports in 6–48 hours · reschedule anytime before collection
            </p>
          </div>

          {/* Sticky recap: where, when, and what it costs. */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.1 }}
            className="space-y-3 lg:sticky lg:top-20"
          >
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-foreground">Collection details</h2>

              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">Address</p>
                  {collectionAddress ? (
                    <p className="text-sm leading-snug text-foreground">
                      <span className="font-semibold capitalize">
                        {collectionAddress.name.toLowerCase()}
                      </span>{" "}
                      —{" "}
                      {[
                        collectionAddress.address,
                        collectionAddress.city,
                        collectionAddress.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selected address</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2.5 border-t border-dashed border-border pt-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">Slot</p>
                  {selectedSlotTitle ? (
                    <motion.p
                      key={selectedSlotTitle}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                      className="text-sm leading-snug font-semibold text-foreground"
                    >
                      {format(date, "EEE, d MMM")} · {selectedSlotTitle}
                    </motion.p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Pick a time slot to continue</p>
                  )}
                </div>
              </div>

              <ProceedButton
                onProceed={goToPayment}
                disabled={!canContinue}
                loading={submitting}
                label="Proceed to Payment"
                className="mt-4 hidden w-full lg:flex"
              />
            </div>

            {(cart?.cartItems.length ?? 0) > 0 && cart && (
              <OrderSummaryCard summary={cart.paymentSummary} />
            )}
          </motion.aside>
        </div>
      </div>

      {/* Mobile/tablet CTA — hidden at lg where the sticky panel carries it. */}
      <motion.div
        initial={{ y: 88, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        className="fixed inset-x-0 bottom-[calc(var(--bottom-tab-bar-height)+var(--safe-area-bottom))] z-30 px-4 pb-3 md:bottom-4 lg:hidden"
      >
        <div className="glass-panel mx-auto flex max-w-2xl items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/10">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              {format(date, "EEE, d MMM")}
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {selectedSlotTitle ?? "No slot selected"}
            </p>
          </div>
          <ProceedButton
            onProceed={goToPayment}
            disabled={!canContinue}
            loading={submitting}
            label="Pay"
            className="shrink-0 px-5"
          />
        </div>
      </motion.div>
    </div>
  );
}
