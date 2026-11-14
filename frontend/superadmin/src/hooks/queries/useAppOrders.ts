import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addHomeVisitItemsApi,
  assignPhleboApi,
  createAppOrderApi,
  deleteAppOrderApi,
  fetchAppOrder,
  fetchAppOrders,
  removeHomeVisitItemApi,
  updateAppOrderStatusApi,
  type AddHomeVisitItemsBody,
  type AppOrderListParams,
  type AppOrderStatus,
  type CreateAppOrderBody,
} from "@/services/api/appOrderApi";

const ORDERS_KEY = "app-orders";

export function useAppOrders(params: AppOrderListParams) {
  return useQuery({
    queryKey: [ORDERS_KEY, params],
    queryFn: () => fetchAppOrders(params),
    placeholderData: (prev) => prev, // keeps old rows visible while refetching, avoids empty-flash on filter change
  });
}

export function useAppOrder(id: string | null) {
  return useQuery({
    queryKey: [ORDERS_KEY, "detail", id],
    queryFn: () => fetchAppOrder(id as string),
    enabled: Boolean(id),
  });
}

export function useAssignPhlebo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, phleboId }: { orderId: string; phleboId: string | null }) =>
      assignPhleboApi(orderId, phleboId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useUpdateAppOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: AppOrderStatus }) =>
      updateAppOrderStatusApi(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useCreateAppOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAppOrderBody) => createAppOrderApi(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useAddHomeVisitItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: AddHomeVisitItemsBody }) =>
      addHomeVisitItemsApi(orderId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useRemoveHomeVisitItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      removeHomeVisitItemApi(orderId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useDeleteAppOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAppOrderApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}
