import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Banknote, CreditCard, Loader2, Lock, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { ProceedButton } from "@/components/cart/ProceedButton";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { PaymentMethodCard } from "@/components/payment/PaymentMethodCard";
import { RazorpayCheckoutSheet } from "@/components/payment/RazorpayCheckoutSheet";
import { useConfirmOrder } from "@/hooks/queries/useCheckout";
import { formatRupees } from "@/utils/format";
import type { AppPaymentMode, ReviewCartPaymentSummary } from "@/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface PaymentLocationState {
  order_id: string;
  order_number: string;
  /** Straight off `POST /user/review-cart`. Optional so a session that
   *  navigated here before this was passed through still renders — it just
   *  shows the total on its own, as it always did. */
  payment_summary?: ReviewCartPaymentSummary;
  total_payable: number;
}

function isPaymentState(state: unknown): state is PaymentLocationState {
  return (
    !!state &&
    typeof state === "object" &&
    "order_id" in state &&
    "order_number" in state &&
    "total_payable" in state
  );
}

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const confirmOrder = useConfirmOrder();

  const state = isPaymentState(location.state) ? location.state : null;
  const summary = state?.payment_summary;

  const [method, setMethod] = useState<AppPaymentMode>("cash");
  const [razorpaySheetOpen, setRazorpaySheetOpen] = useState(false);

  useEffect(() => {
    if (!state) {
      toast.error("Your checkout session has expired. Please try again.");
      navigate("/cart", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const handleConfirmSuccess = () => {
    navigate(`/order-confirmation/${state.order_id}`);
  };

  const handleCod = async () => {
    try {
      await confirmOrder.mutateAsync({ order_id: state.order_id, payment_type: "cash" });
      handleConfirmSuccess();
    } catch {
      // toast already shown by the mutation's onError
    }
  };

  // Unlike Cash on Delivery, nothing is confirmed/booked here up front —
  // opening the sheet goes straight into Razorpay's checkout, and the
  // booking itself is only created after that payment actually verifies
  // (see `finalizeOnlinePaymentBooking` on the backend). A failed or
  // abandoned payment this way leaves nothing behind to look "booked".
  const handlePayOnlineClick = () => setRazorpaySheetOpen(true);

  const submit = () => (method === "cash" ? handleCod() : handlePayOnlineClick());
  const ctaLabel =
    method === "cash" ? "Confirm Booking" : `Pay ${formatRupees(state.total_payable)}`;

  return (
    <div className="min-h-screen pb-32 lg:pb-10">
      <PageHeader title="Payment" />

      <div className="mx-auto max-w-7xl px-4 py-4">
        <CheckoutSteps current="payment" className="mb-5" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="mb-4 flex items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-md">
            <CreditCard className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              How would you like to pay?
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              Choose a payment method to confirm your booking
            </p>
          </div>
          <span className="ml-auto hidden shrink-0 rounded-full border border-border/60 bg-card px-3 py-1.5 font-mono text-[11px] font-semibold text-muted-foreground shadow-sm sm:block">
            {state.order_number}
          </span>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.04 }}
            className="space-y-3"
          >
            <PaymentMethodCard
              icon={Banknote}
              title="Cash on Delivery"
              description="Pay in cash to the phlebotomist at your doorstep"
              badges={["No advance", "Exact change helps"]}
              note="Your booking is confirmed instantly. Keep the amount ready at collection time."
              selected={method === "cash"}
              onSelect={() => setMethod("cash")}
            />
            <PaymentMethodCard
              icon={Wallet}
              title="Pay Online"
              description="UPI, Cards, Netbanking & Wallets via Razorpay"
              badges={["UPI", "Cards", "Netbanking", "Wallets"]}
              note="You'll be taken to Razorpay's secure checkout. Your booking is only confirmed once payment succeeds — nothing is charged or booked otherwise."
              selected={method === "online"}
              onSelect={() => setMethod("online")}
            />

            <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-3">
              <ShieldCheck className="mt-px size-4 shrink-0 text-primary" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Payments are processed over an encrypted connection by Razorpay. The lab never
                stores your card or UPI details.
              </p>
            </div>
          </motion.div>

          {/* Sticky amount panel — carries the CTA at lg and up. */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.08 }}
            className="lg:sticky lg:top-20"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
              <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] px-5 py-5 text-center">
                <div
                  aria-hidden
                  className="absolute -top-10 -right-8 size-32 rounded-full bg-white/20 blur-2xl"
                />
                <div className="relative">
                  <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium tracking-wide text-white/60 uppercase">
                    <Lock className="size-3" />
                    Amount payable
                  </p>
                  <motion.p
                    key={state.total_payable}
                    initial={{ scale: 1.08, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 18, stiffness: 380 }}
                    className="mt-1 text-3xl font-extrabold tabular-nums text-white"
                  >
                    {formatRupees(state.total_payable)}
                  </motion.p>
                  <p className="mt-1 font-mono text-[11px] text-white/60">{state.order_number}</p>
                </div>
              </div>

              <div className="space-y-3 px-5 py-4">
                {/* What the amount above is made of. The phlebotomy charge is
                    the reason this exists: it is added at review-cart time
                    from the address's area rate, so it appears in the total
                    without ever having been named on any earlier step. */}
                {summary && (
                  <div className="space-y-2 border-b border-dashed border-border pb-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatRupees(summary.subtotal)}
                      </span>
                    </div>

                    {summary.phlebotomy_charges > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Home collection charge</span>
                        <span className="font-medium tabular-nums text-foreground">
                          {formatRupees(summary.phlebotomy_charges)}
                        </span>
                      </div>
                    )}

                    {summary.coupon_discount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Coupon discount</span>
                        <span className="font-medium tabular-nums">
                          −{formatRupees(summary.coupon_discount)}
                        </span>
                      </div>
                    )}

                    {summary.wallet_discount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Wallet discount</span>
                        <span className="font-medium tabular-nums">
                          −{formatRupees(summary.wallet_discount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paying via</span>
                  <span className="font-semibold text-foreground">
                    {method === "cash" ? "Cash on Delivery" : "Online"}
                  </span>
                </div>

                <ProceedButton
                  onProceed={submit}
                  disabled={confirmOrder.isPending}
                  loading={confirmOrder.isPending}
                  label={ctaLabel}
                  className="hidden w-full lg:flex"
                />

                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                  By continuing you agree to our terms of service.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      {/* Mobile/tablet CTA — hidden at lg where the amount panel carries it. */}
      <motion.div
        initial={{ y: 88, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        className="fixed inset-x-0 bottom-[calc(var(--bottom-tab-bar-height)+var(--safe-area-bottom))] z-30 px-4 pb-3 md:bottom-4 lg:hidden"
      >
        <div className="glass-panel mx-auto flex max-w-2xl items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/10">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Lock className="size-3" />
              {method === "cash" ? "Cash on Delivery" : "Online"}
            </p>
            <p className="text-lg font-extrabold tabular-nums text-foreground">
              {formatRupees(state.total_payable)}
            </p>
          </div>
          <ProceedButton
            onProceed={submit}
            disabled={confirmOrder.isPending}
            loading={confirmOrder.isPending}
            label={method === "cash" ? "Confirm" : "Pay Now"}
            className="ml-auto flex-1 sm:max-w-48"
          />
        </div>
      </motion.div>

      <RazorpayCheckoutSheet
        open={razorpaySheetOpen}
        onOpenChange={setRazorpaySheetOpen}
        orderId={state.order_id}
        amount={state.total_payable}
        onSuccess={handleConfirmSuccess}
      />

      {confirmOrder.isPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/90 backdrop-blur-md">
          <div className="relative flex size-24 items-center justify-center">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 blur-xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.5_0.22_20)] text-white shadow-xl"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Loader2 className="size-8 animate-spin" />
            </motion.div>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">Confirming your booking…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hold on a moment — don&apos;t close or refresh this page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
