import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PaymentResult } from "@/components/payment/PaymentResult";
import { useCreatePaymentOrder, useVerifyPayment } from "@/hooks/queries/useCheckout";
import { useAuth } from "@/hooks/useAuth";
import { openRazorpayCheckout } from "@/utils/razorpay";

interface RazorpayCheckoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  onSuccess: () => void;
}

type Step = "processing" | "failed";

/** Collects payment for an order the caller has already confirmed
 *  (`payment_type: "online"`) — this sheet only ever drives create-payment-
 *  order -> the real Razorpay checkout -> verify. It never calls
 *  confirm-order itself, so retrying after a failure is safe (the backend
 *  rejects a second confirm-order call on an already-confirmed order).
 *
 *  No "are you sure, tap to pay" step of its own — Razorpay's own checkout
 *  IS that confirmation. Opening (`open` turning true) launches it straight
 *  away; only a failure/cancel shows anything here. */
function RazorpayCheckoutSheet({
  open,
  onOpenChange,
  orderId,
  amount,
  onSuccess,
}: RazorpayCheckoutSheetProps) {
  const [step, setStep] = useState<Step>("processing");
  const { user } = useAuth();
  const createPaymentOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();
  // Guards against StrictMode's dev double-effect (and any other re-render
  // while `open` stays true) opening Razorpay's checkout twice for one visit.
  const launchedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      launchedRef.current = false;
      return;
    }
    if (launchedRef.current) return;
    launchedRef.current = true;
    setStep("processing");
    handlePayNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePayNow = async () => {
    setStep("processing");
    try {
      const rzpOrder = await createPaymentOrder.mutateAsync({
        payload: { purpose: "order_payment", reference_id: orderId },
        amount,
      });

      const razorpayResponse = await openRazorpayCheckout(rzpOrder, {
        description: `Order payment #${orderId.slice(0, 8)}`,
        prefill: { name: user?.name ?? undefined, contact: user?.mobile },
      });

      const verifyResult = await verifyPayment.mutateAsync({
        payment_id: rzpOrder.payment_id,
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      });

      if (verifyResult.status !== "success") {
        setStep("failed");
        return;
      }

      onOpenChange(false);
      onSuccess();
    } catch {
      setStep("failed");
    }
  };

  return (
    <>
      <BottomSheet open={open && step === "failed"} onOpenChange={onOpenChange}>
        {step === "failed" && (
          <PaymentResult
            status="failed"
            title="Payment failed"
            description="Nothing was booked or charged. You can retry now, or come back to complete this booking later."
            primaryLabel="Retry Payment"
            onPrimary={handlePayNow}
            secondaryLabel="Cancel"
            onSecondary={() => onOpenChange(false)}
          />
        )}
      </BottomSheet>

      <AnimatePresence>
        {open && step === "processing" && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
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
              <p className="text-base font-bold text-foreground">Processing your payment…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please don&apos;t close or refresh this page
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { RazorpayCheckoutSheet };
