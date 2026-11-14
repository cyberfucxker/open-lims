import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCouponApi,
  deleteCouponApi,
  fetchCoupons,
  reorderHomeCouponsApi,
  setCouponHomeFeatureApi,
  setCouponStatusApi,
  updateCouponApi,
  type CouponFormValues,
  type CouponListParams,
} from "@/services/api/couponApi";

export function useCoupons(params: CouponListParams) {
  return useQuery({
    queryKey: ["coupons", params],
    queryFn: () => fetchCoupons(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CouponFormValues) => createCouponApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CouponFormValues }) =>
      updateCouponApi(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useSetCouponStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setCouponStatusApi(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCouponApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useSetCouponHomeFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, showOnHome }: { id: string; showOnHome: boolean }) =>
      setCouponHomeFeatureApi(id, showOnHome),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useReorderHomeCoupons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reorderHomeCouponsApi(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });
}
