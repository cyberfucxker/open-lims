import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCmsPageApi,
  deleteCmsPageApi,
  duplicateCmsPageApi,
  fetchCmsPage,
  fetchCmsPages,
  setCmsPageStatusApi,
  updateCmsPageApi,
  type CmsPageFormValues,
  type CmsPageListParams,
  type CmsPageStatus,
} from "@/services/api/cmsPageApi";

const CMS_PAGES_KEY = "cms-pages";

export function useCmsPages(params: CmsPageListParams) {
  return useQuery({
    queryKey: [CMS_PAGES_KEY, params],
    queryFn: () => fetchCmsPages(params),
    placeholderData: (prev) => prev,
  });
}

export function useCmsPage(id: string | null) {
  return useQuery({
    queryKey: [CMS_PAGES_KEY, "detail", id],
    queryFn: () => fetchCmsPage(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CmsPageFormValues) => createCmsPageApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CMS_PAGES_KEY] }),
  });
}

export function useUpdateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CmsPageFormValues }) =>
      updateCmsPageApi(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CMS_PAGES_KEY] }),
  });
}

export function useSetCmsPageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CmsPageStatus }) =>
      setCmsPageStatusApi(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CMS_PAGES_KEY] }),
  });
}

export function useDuplicateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateCmsPageApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CMS_PAGES_KEY] }),
  });
}

export function useDeleteCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCmsPageApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CMS_PAGES_KEY] }),
  });
}
