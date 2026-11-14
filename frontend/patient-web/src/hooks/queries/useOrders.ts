import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orderApi } from "@/services/api/orderApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { CancelOrderRequest, CreateHomeVisitRequest, OrdersFilter } from "@/types";

export const ORDERS_QUERY_KEY = ["orders"];

export function useOrders(filter: OrdersFilter = "all") {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, filter],
    queryFn: () => orderApi.listOrders(filter),
  });
}

export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => orderApi.getOrderDetail(id as string),
    enabled: !!id,
  });
}

export function useCancelOrder(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CancelOrderRequest) => orderApi.cancelOrder(id as string, payload),
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not cancel booking");
    },
  });
}

export function useCreateHomeVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateHomeVisitRequest) => orderApi.createHomeVisit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not book home visit");
    },
  });
}
