import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, MapPinPlus, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { AddressCard } from "@/components/address/AddressCard";
import { AddressFormSheet } from "@/components/address/AddressFormSheet";
import { AddressSkeleton } from "@/components/address/AddressSkeleton";
import { CartSummaryBar } from "@/components/cart/CartSummaryBar";
import { OrderSummaryCard } from "@/components/cart/OrderSummaryCard";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { FamilyMemberSection } from "@/components/checkout/FamilyMemberSection";
import { useAddresses, useRemoveAddress, useSetDefaultAddress } from "@/hooks/queries/useAddress";
import { useCart, useSetCartFamilyMember } from "@/hooks/queries/useCart";
import { useBookingStore } from "@/store/bookingStore";
import type { AddressResult } from "@/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function AddressListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectMode = searchParams.get("select") === "1";

  const { data: addresses, isLoading } = useAddresses();
  const removeAddress = useRemoveAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const setAddress = useBookingStore((s) => s.setAddress);
  const currentSelectedAddressId = useBookingStore((s) => s.selectedAddressId);
  const selectedFamilyMemberId = useBookingStore((s) => s.selectedFamilyMemberId);
  const setFamilyMember = useBookingStore((s) => s.setFamilyMember);
  const setCartFamilyMember = useSetCartFamilyMember();

  // Read-only order recap beside the address picker during checkout. Already
  // cached by the Cart page's own `useCart`, so this costs no extra round trip.
  const { data: cart } = useCart();
  const showSummary = selectMode && (cart?.cartItems.length ?? 0) > 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressResult | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedAddresses = useMemo(() => {
    if (!addresses) return [];
    return [...addresses].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  }, [addresses]);

  // Pre-select the default address (or the first one, if none is marked
  // default) so the radio isn't blank until the user taps something —
  // also re-runs if the previously selected address got deleted, so the
  // store never points at an address that no longer exists.
  useEffect(() => {
    if (!addresses || addresses.length === 0) return;
    const stillExists = addresses.some((a) => a.id === currentSelectedAddressId);
    if (stillExists) return;
    const fallback = addresses.find((a) => a.is_default) ?? addresses[0];
    setAddress(fallback.id);
  }, [addresses, currentSelectedAddressId, setAddress]);

  const openAddSheet = () => {
    setEditingAddress(null);
    setSheetOpen(true);
  };

  // Tapping a card only ever picks it — same radio-select feel as the Slot
  // step's time-slot grid. Nothing syncs to the server or navigates until
  // "Continue" is pressed below.
  const handleSelectAddress = (id: string) => setAddress(id);

  const canContinue = !!currentSelectedAddressId && (!selectMode || !!selectedFamilyMemberId);

  const handleContinue = async () => {
    if (setCartFamilyMember.isPending) return;
    if (!currentSelectedAddressId) {
      toast.error("Please select an address");
      return;
    }
    if (selectMode) {
      if (!selectedFamilyMemberId) {
        toast.error("Please select who this booking is for");
        return;
      }
      try {
        await setCartFamilyMember.mutateAsync(selectedFamilyMemberId);
      } catch {
        return; // toast already shown by the mutation's onError
      }
    }
    navigate("/slots");
  };

  const isEmpty = !isLoading && sortedAddresses.length === 0;

  return (
    <div className={showSummary ? "min-h-screen pb-32 lg:pb-10" : "min-h-screen pb-10"}>
      <PageHeader
        title={selectMode ? "Select Address" : "Manage Addresses"}
        right={
          <Button variant="ghost" size="icon" aria-label="Add address" onClick={openAddSheet}>
            <Plus className="size-5" />
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-4">
        {selectMode && <CheckoutSteps current="address" className="mb-5" />}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="mb-4 flex items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-md">
            <MapPin className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {selectMode ? "Where should we collect?" : "Your addresses"}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {selectMode
                ? "Pick a collection address — our phlebotomist visits at your chosen slot"
                : "Manage the addresses saved to your account"}
            </p>
          </div>
        </motion.div>

        <div
          className={
            showSummary
              ? "grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]"
              : undefined
          }
        >
          <div className="space-y-5">
            {selectMode && (
              <FamilyMemberSection
                selectedId={selectedFamilyMemberId}
                onSelect={(m) => setFamilyMember(m.id)}
              />
            )}

            {isLoading ? (
              <AddressSkeleton count={3} />
            ) : isEmpty ? (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"
              >
                <div className="relative mb-5 flex size-24 items-center justify-center">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 blur-xl"
                  />
                  <motion.span
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex size-20 items-center justify-center rounded-3xl border border-border/60 bg-card shadow-lg"
                  >
                    <MapPinPlus className="size-8 text-primary" />
                  </motion.span>
                </div>
                <h2 className="text-base font-bold text-foreground">No saved addresses yet</h2>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Add an address so our phlebotomist knows where to collect your sample.
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-5"
                >
                  <Button
                    size="lg"
                    onClick={openAddSheet}
                    className="bg-gradient-to-r from-primary to-[oklch(0.5_0.22_20)] shadow-lg shadow-primary/25"
                  >
                    <Plus className="size-4" /> Add Address
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {sortedAddresses.map((address, i) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        index={i}
                        selectMode={selectMode}
                        isSelected={address.id === currentSelectedAddressId}
                        onSelect={() => handleSelectAddress(address.id)}
                        onEdit={() => {
                          setEditingAddress(address);
                          setSheetOpen(true);
                        }}
                        onDelete={() => setDeletingId(address.id)}
                        onSetDefault={() => setDefaultAddress.mutate(address.id)}
                        settingDefault={setDefaultAddress.isPending}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={openAddSheet}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-card/60 p-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground"
                >
                  <Plus className="size-4" />
                  Add new address
                </motion.button>

                {selectMode && (
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-primary" />
                    Trained phlebotomist · sealed sample kit · no collection charges
                  </p>
                )}
              </>
            )}
          </div>

          {showSummary && cart && (
            <OrderSummaryCard
              summary={cart.paymentSummary}
              onProceed={handleContinue}
              label="Continue"
              disabled={!canContinue}
              loading={setCartFamilyMember.isPending}
            />
          )}
        </div>
      </div>

      {/* Mobile/tablet CTA — hidden at lg where the sticky summary carries it. */}
      {showSummary && cart && (
        <CartSummaryBar
          itemCount={cart.paymentSummary.itemCount}
          totalPayable={cart.paymentSummary.totalPayable}
          onProceed={handleContinue}
          disabled={!canContinue}
          loading={setCartFamilyMember.isPending}
          label="Continue"
        />
      )}

      <AddressFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialAddress={editingAddress}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this address?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deletingId) {
            removeAddress.mutate(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}
