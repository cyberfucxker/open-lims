import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createWebBannerApi,
  deleteWebBannerApi,
  fetchWebBanners,
  reorderWebBannersApi,
  setWebBannerStatusApi,
  updateWebBannerApi,
  type WebBannerFormValues,
  type WebBannerListParams,
} from "@/services/api/webBannerApi";

export function useWebBanners(params: WebBannerListParams = {}) {
  return useQuery({
    queryKey: ["web-banners", "list", params],
    queryFn: () => fetchWebBanners(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateWebBanners() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["web-banners", "list"] });
}

export function useCreateWebBanner() {
  const invalidate = useInvalidateWebBanners();
  return useMutation({
    mutationFn: (values: WebBannerFormValues) => createWebBannerApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateWebBanner() {
  const invalidate = useInvalidateWebBanners();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WebBannerFormValues }) =>
      updateWebBannerApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetWebBannerStatus() {
  const invalidate = useInvalidateWebBanners();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setWebBannerStatusApi(id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteWebBanner() {
  const invalidate = useInvalidateWebBanners();
  return useMutation({
    mutationFn: (id: string) => deleteWebBannerApi(id),
    onSuccess: invalidate,
  });
}

export function useReorderWebBanners() {
  const invalidate = useInvalidateWebBanners();
  return useMutation({
    mutationFn: (ids: string[]) => reorderWebBannersApi(ids),
    onSuccess: invalidate,
  });
}
