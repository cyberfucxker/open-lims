import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRechargeOfferApi,
  deleteRechargeOfferApi,
  fetchRechargeOffers,
  setRechargeOfferStatusApi,
  updateRechargeOfferApi,
  type RechargeOfferFormValues,
  type RechargeOfferListParams,
} from "@/services/api/rechargeOfferApi";

const RECHARGE_OFFERS_KEY = "recharge-offers";

export function useRechargeOffers(params: RechargeOfferListParams) {
  return useQuery({
    queryKey: [RECHARGE_OFFERS_KEY, params],
    queryFn: () => fetchRechargeOffers(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRechargeOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: RechargeOfferFormValues) => createRechargeOfferApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RECHARGE_OFFERS_KEY] }),
  });
}

export function useUpdateRechargeOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RechargeOfferFormValues }) =>
      updateRechargeOfferApi(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RECHARGE_OFFERS_KEY] }),
  });
}

export function useSetRechargeOfferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setRechargeOfferStatusApi(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RECHARGE_OFFERS_KEY] }),
  });
}

export function useDeleteRechargeOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRechargeOfferApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RECHARGE_OFFERS_KEY] }),
  });
}
