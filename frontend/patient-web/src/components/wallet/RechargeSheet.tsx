import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecharge, useRechargeOffers } from "@/hooks/queries/useWallet";
import { cn } from "@/utils/cn";
import { formatRupees } from "@/utils/format";
import type { RechargeOffer } from "@/types";

import { getOfferCredit } from "./walletSource";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

interface RechargeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the custom amount when the sheet is opened from a quick-add chip. */
  initialAmount?: number | null;
}

function OfferCard({
  offer,
  isSelected,
  isBestValue,
  onSelect,
}: {
  offer: RechargeOffer;
  isSelected: boolean;
  isBestValue: boolean;
  onSelect: () => void;
}) {
  const amount = Number(offer.recharge_amount);
  const bonus = Number(offer.bonus_amount);
  const credit = getOfferCredit(offer);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "relative overflow-hidden rounded-xl border p-3 pr-8 text-left outline-none transition-all focus-visible:ring-4 focus-visible:ring-ring",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/30 hover:bg-accent",
      )}
    >
      {isBestValue && (
        <span className="absolute top-0 right-0 rounded-bl-lg bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-primary-foreground">
          BEST
        </span>
      )}

      <p className="text-lg leading-tight font-bold tabular-nums">{formatRupees(amount)}</p>
      {bonus > 0 ? (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          +{formatRupees(bonus)} bonus
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No bonus</p>
      )}
      <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
        You get {formatRupees(credit)}
      </p>

      {isSelected && (
        <span className="absolute right-2 bottom-2.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-2.5" />
        </span>
      )}
    </button>
  );
}

function RechargeSheet({ open, onOpenChange, initialAmount = null }: RechargeSheetProps) {
  const { data: offersData, isLoading: offersLoading } = useRechargeOffers();
  const rechargeMutation = useRecharge();
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const offers = offersData?.data ?? [];

  /** Each opening starts clean, seeded by the quick-add amount when one was tapped. */
  useEffect(() => {
    if (!open) return;
    setSelectedOfferId(null);
    setCustomAmount(initialAmount ? String(initialAmount) : "");
  }, [open, initialAmount]);

  const handleSelectOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    setCustomAmount("");
  };

  const handleQuickAmount = (amount: number) => {
    setSelectedOfferId(null);
    setCustomAmount(String(amount));
  };

  const handleConfirm = () => {
    const offer = offers.find((o) => o.id === selectedOfferId);
    const amount = offer ? Number(offer.recharge_amount) : Number(customAmount);

    if (!amount || amount <= 0) {
      toast.error("Please select an offer or enter a valid amount");
      return;
    }

    rechargeMutation.mutate(
      { amount, offer_id: offer?.id },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedOfferId(null);
          setCustomAmount("");
        },
      },
    );
  };

  // Highlight the richest bonus so the best deal doesn't have to be worked out by hand.
  const bestValueOfferId = offers.reduce<{ id: string | null; bonus: number }>(
    (best, offer) => {
      const bonus = Number(offer.bonus_amount) || 0;
      return bonus > best.bonus ? { id: offer.id, bonus } : best;
    },
    { id: null, bonus: 0 },
  ).id;

  const selectedOffer = offers.find((o) => o.id === selectedOfferId);
  const payable = selectedOffer ? Number(selectedOffer.recharge_amount) : Number(customAmount);
  const hasAmount = Number.isFinite(payable) && payable > 0;
  const credit = selectedOffer ? getOfferCredit(selectedOffer) : payable;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add Money">
      <div className="space-y-5">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Recharge offers
            </Label>
            {offers.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-3" />
                Extra credit included
              </span>
            )}
          </div>

          {offersLoading ? (
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[86px] rounded-xl" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No offers running right now — enter any amount below.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isSelected={selectedOfferId === offer.id}
                  isBestValue={offer.id === bestValueOfferId}
                  onSelect={() => handleSelectOffer(offer.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <Label
            htmlFor="recharge-custom-amount"
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Or enter an amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              ₹
            </span>
            <Input
              id="recharge-custom-amount"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedOfferId(null);
              }}
              className="pl-8 tabular-nums"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  !selectedOfferId && customAmount === String(amount)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {formatRupees(amount)}
              </button>
            ))}
          </div>
        </div>

        {hasAmount && (
          <div className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-3.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>You pay</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatRupees(payable)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Wallet credit</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  credit > payable ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                )}
              >
                {formatRupees(credit)}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={rechargeMutation.isPending}
          >
            {rechargeMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : hasAmount ? (
              `Add ${formatRupees(payable)}`
            ) : (
              "Add Money"
            )}
          </Button>
          <p className="inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Secured by Razorpay · your card details never touch our servers
          </p>
        </div>
      </div>
    </BottomSheet>
  );
}

export { RechargeSheet };
