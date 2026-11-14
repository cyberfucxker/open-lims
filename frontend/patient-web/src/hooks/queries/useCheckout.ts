import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orderApi } from "@/services/api/orderApi";
import { paymentApi } from "@/services/api/paymentApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { CART_QUERY_KEY } from "@/hooks/queries/useCart";
import { ORDERS_QUERY_KEY } from "@/hooks/queries/useOrders";
import type { ConfirmOrderRequest, CreatePaymentOrderRequest, VerifyPaymentRequest } from "@/types";

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmOrderRequest) => orderApi.confirmOrder(payload),
    onSuccess: () => {
      // confirmOrder clears the cart server-side — drop the pre-checkout cache
      // snapshot so the cart badge/page reflect empty immediately, not after 30s staleTime.
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not confirm your booking");
    },
  });
}

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: ({ payload }: { payload: CreatePaymentOrderRequest; amount: number }) =>
      paymentApi.createOrder(payload),
    onError: (err) => {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not initiate payment");
    },
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: (payload: VerifyPaymentRequest) => paymentApi.verify(payload),
  });
}
