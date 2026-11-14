import type { CreatePaymentOrderResult } from "@/types";
import type { RazorpayCheckoutResponse } from "@/types/razorpay";

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<boolean> | null = null;

/** Loads the Razorpay Checkout.js SDK once and caches the in-flight/settled
 *  promise so concurrent callers (or repeat opens) never inject the script twice. */
function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);

  scriptPromise ??= new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/** Opens the real Razorpay Checkout modal for an order created via
 *  `POST /user/payments/create-order`, resolving with the genuine
 *  payment id/signature Razorpay returns on success (rejects on failure,
 *  or if the user closes the modal). */
export async function openRazorpayCheckout(
  order: CreatePaymentOrderResult,
  options?: { description?: string; prefill?: { name?: string; email?: string; contact?: string } },
): Promise<RazorpayCheckoutResponse> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error(
      "Could not load the Razorpay checkout. Check your internet connection and try again.",
    );
  }

  return new Promise((resolve, reject) => {
    const Razorpay = window.Razorpay;
    if (!Razorpay) {
      reject(new Error("Razorpay checkout failed to initialize."));
      return;
    }

    const instance = new Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.razorpay_order_id,
      name: "Example Diagnostics Lab",
      description: options?.description,
      prefill: options?.prefill,
      theme: { color: "#EB0401" },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
    });

    instance.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed."));
    });

    instance.open();
  });
}
