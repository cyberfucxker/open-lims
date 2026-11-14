import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addFranchiseHomeVisitItems,
  assignFranchiseOrderPhlebo,
  changePassword,
  changeUsername,
  createAreaRequest,
  createFranchiseOrder,
  createFranchisePhlebo,
  fetchFranchiseDashboard,
  fetchFranchiseNotifications,
  fetchFranchiseOrder,
  fetchFranchiseOrders,
  fetchFranchisePhlebos,
  fetchFranchisePriceList,
  fetchFranchiseProfile,
  fetchFranchiseReports,
  fetchFranchiseServiceAreas,
  fetchOwnAreaRequests,
  markAllFranchiseNotificationsRead,
  markFranchiseNotificationRead,
  removeFranchiseHomeVisitItem,
  saveFranchisePriceListItems,
  setFranchisePhleboStatus,
  updateFranchiseOrderStatus,
  updateFranchiseProfile,
  uploadFranchiseLogo,
  type AddFranchiseHomeVisitItemsBody,
  type CreateAreaRequestBody,
  type CreateFranchiseOrderBody,
  type CreateFranchisePhleboBody,
  type FranchisePeriod,
  type FranchiseProfileUpdate,
  type ListFranchiseOrdersParams,
  type PriceListItemType,
} from "@/services/api/franchiseApi";
import type { AppOrderStatus } from "@/services/api/appOrderApi";

export function useFranchiseProfile() {
  return useQuery({
    queryKey: ["franchise", "me"],
    queryFn: fetchFranchiseProfile,
    staleTime: 60 * 1000,
  });
}

export function useUpdateFranchiseProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FranchiseProfileUpdate) => updateFranchiseProfile(values),
    onSuccess: (profile) => queryClient.setQueryData(["franchise", "me"], profile),
  });
}

export function useUploadFranchiseLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadFranchiseLogo(file),
    onSuccess: (profile) => queryClient.setQueryData(["franchise", "me"], profile),
  });
}

export function useFranchiseDashboard(period: FranchisePeriod) {
  return useQuery({
    queryKey: ["franchise", "dashboard", period],
    queryFn: () => fetchFranchiseDashboard(period),
    placeholderData: (prev) => prev,
  });
}

export function useFranchiseOrders(params: ListFranchiseOrdersParams) {
  return useQuery({
    queryKey: ["franchise", "orders", params],
    queryFn: () => fetchFranchiseOrders(params),
    placeholderData: (prev) => prev,
  });
}

export function useFranchiseOrder(id: string | null) {
  return useQuery({
    queryKey: ["franchise", "orders", "detail", id],
    queryFn: () => fetchFranchiseOrder(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateFranchiseOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: AppOrderStatus }) =>
      updateFranchiseOrderStatus(orderId, status),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["franchise", "orders", "detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["franchise", "orders"], exact: false });
    },
  });
}

export function useAssignFranchiseOrderPhlebo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, phleboId }: { orderId: string; phleboId: string | null }) =>
      assignFranchiseOrderPhlebo(orderId, phleboId),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["franchise", "orders", "detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["franchise", "orders"], exact: false });
    },
  });
}

export function useAddFranchiseHomeVisitItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: AddFranchiseHomeVisitItemsBody }) =>
      addFranchiseHomeVisitItems(orderId, body),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["franchise", "orders", "detail", orderId] });
    },
  });
}

export function useRemoveFranchiseHomeVisitItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      removeFranchiseHomeVisitItem(orderId, itemId),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["franchise", "orders", "detail", orderId] });
    },
  });
}

export function useCreateFranchiseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFranchiseOrderBody) => createFranchiseOrder(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["franchise", "orders"], exact: false }),
  });
}

// --- Phlebotomists -----------------------------------------------------

export function useFranchisePhlebos() {
  return useQuery({
    queryKey: ["franchise", "phlebos"],
    queryFn: fetchFranchisePhlebos,
  });
}

export function useCreateFranchisePhlebo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFranchisePhleboBody) => createFranchisePhlebo(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["franchise", "phlebos"] }),
  });
}

export function useSetFranchisePhleboStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setFranchisePhleboStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["franchise", "phlebos"] }),
  });
}

export function useFranchiseReports(params: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["franchise", "reports", params],
    queryFn: () => fetchFranchiseReports(params),
    placeholderData: (prev) => prev,
  });
}

export function useFranchisePriceList() {
  return useQuery({
    queryKey: ["franchise", "price-list"],
    queryFn: fetchFranchisePriceList,
    // Retrying a 404 is pointless here — "no price list assigned" is a stable
    // state the page renders an explanation for, not a transient failure.
    retry: false,
  });
}

export function useSaveFranchisePrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      items: { itemType: PriceListItemType; itemId: string; price: number; isOffered: boolean }[],
    ) => saveFranchisePriceListItems(items),
    onSuccess: (priceList) => queryClient.setQueryData(["franchise", "price-list"], priceList),
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}

export function useChangeUsername() {
  return useMutation({ mutationFn: changeUsername });
}

export function useFranchiseServiceAreas() {
  return useQuery({
    queryKey: ["franchise", "service-areas"],
    queryFn: fetchFranchiseServiceAreas,
  });
}

export function useOwnAreaRequests() {
  return useQuery({
    queryKey: ["franchise", "area-requests"],
    queryFn: fetchOwnAreaRequests,
  });
}

export function useCreateAreaRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAreaRequestBody) => createAreaRequest(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["franchise", "area-requests"] }),
  });
}

// --- Notifications -------------------------------------------------------

/** Polls rather than pushing — there's no websocket/SSE channel into the
 *  franchise portal yet, so a new booking shows up within one interval. */
export function useFranchiseNotifications() {
  return useQuery({
    queryKey: ["franchise", "notifications"],
    queryFn: () => fetchFranchiseNotifications({ pageSize: 20 }),
    refetchInterval: 30_000,
  });
}

export function useMarkFranchiseNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markFranchiseNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["franchise", "notifications"] }),
  });
}

export function useMarkAllFranchiseNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllFranchiseNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["franchise", "notifications"] }),
  });
}
