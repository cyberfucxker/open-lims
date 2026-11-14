import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBannerApi,
  deleteBannerApi,
  fetchBanners,
  reorderBannersApi,
  setBannerStatusApi,
  updateBannerApi,
  type BannerFormValues,
  type BannerListParams,
} from "@/services/api/bannerApi";

export function useBanners(params: BannerListParams) {
  return useQuery({
    queryKey: ["banners", "list", params],
    queryFn: () => fetchBanners(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateBanners() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["banners", "list"] });
}

export function useCreateBanner() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: (values: BannerFormValues) => createBannerApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateBanner() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BannerFormValues }) =>
      updateBannerApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetBannerStatus() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setBannerStatusApi(id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteBanner() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: (id: string) => deleteBannerApi(id),
    onSuccess: invalidate,
  });
}

export function useReorderBanners() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: (ids: string[]) => reorderBannersApi(ids),
    onSuccess: invalidate,
  });
}
