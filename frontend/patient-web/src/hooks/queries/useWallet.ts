import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { walletApi } from "@/services/api/walletApi";
import { paymentApi } from "@/services/api/paymentApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { openRazorpayCheckout } from "@/utils/razorpay";

export const WALLET_BALANCE_QUERY_KEY = ["wallet", "balance"];
export const WALLET_OFFERS_QUERY_KEY = ["wallet", "offers"];
export const WALLET_TRANSACTIONS_QUERY_KEY = ["wallet", "transactions"];

export function useWalletBalance() {
  return useQuery({ queryKey: WALLET_BALANCE_QUERY_KEY, queryFn: walletApi.getBalance });
}

export function useRechargeOffers() {
  return useQuery({ queryKey: WALLET_OFFERS_QUERY_KEY, queryFn: walletApi.getRechargeOffers });
}

export function useWalletTransactions() {
  return useQuery({ queryKey: WALLET_TRANSACTIONS_QUERY_KEY, queryFn: walletApi.getTransactions });
}

export function useInitiateRecharge() {
  return useMutation({
    mutationFn: walletApi.initiateRecharge,
    onError: () => toast.error("Could not start recharge"),
  });
}

export function useVerifyRecharge() {
  return useMutation({
    mutationFn: walletApi.verifyRecharge,
    onError: () => toast.error("Could not verify recharge"),
  });
}

/** Composite helper used by WalletPage's "Add Money" flow — the full real
 *  chain: initiate the recharge, create a Razorpay order for it, open the
 *  actual Razorpay Checkout modal, verify the genuine payment signature,
 *  then confirm the recharge so the wallet is credited. Requires Razorpay
 *  keys to be configured (Superadmin Settings > Payment Gateway, or
 *  RAZORPAY_KEY_ID/SECRET) — without them, create-order fails with a clear
 *  "Razorpay is not configured" error surfaced via the toast below. */
export function useRecharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, offer_id }: { amount: number; offer_id?: string }) => {
      const initiated = await walletApi.initiateRecharge({ amount, offer_id });

      const order = await paymentApi.createOrder({
        purpose: "wallet_recharge",
        reference_id: initiated.recharge_id,
      });

      const checkoutResult = await openRazorpayCheckout(order, { description: "Wallet Recharge" });

      const verifyPaymentResult = await paymentApi.verify({
        payment_id: order.payment_id,
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
      });

      if (verifyPaymentResult.status !== "success") {
        throw new ApiRequestError("Payment could not be verified. No amount was added.");
      }

      return walletApi.verifyRecharge({
        recharge_id: initiated.recharge_id,
        payment_id: order.payment_id,
      });
    },
    onSuccess: (result) => {
      toast.success(`₹${result.credited_amount} added to your wallet`);
      queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WALLET_TRANSACTIONS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Recharge failed. Please try again.");
    },
  });
}
