import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createHomeFaqApi,
  deleteHomeFaqApi,
  fetchHomeFaqs,
  reorderHomeFaqsApi,
  setHomeFaqStatusApi,
  updateHomeFaqApi,
  type HomeFaqFormValues,
  type HomeFaqListParams,
} from "@/services/api/homeFaqApi";

export function useHomeFaqs(params: HomeFaqListParams) {
  return useQuery({
    queryKey: ["home-faqs", "list", params],
    queryFn: () => fetchHomeFaqs(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateHomeFaqs() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["home-faqs", "list"] });
}

export function useCreateHomeFaq() {
  const invalidate = useInvalidateHomeFaqs();
  return useMutation({
    mutationFn: (values: HomeFaqFormValues) => createHomeFaqApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateHomeFaq() {
  const invalidate = useInvalidateHomeFaqs();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: HomeFaqFormValues }) =>
      updateHomeFaqApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetHomeFaqStatus() {
  const invalidate = useInvalidateHomeFaqs();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setHomeFaqStatusApi(id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteHomeFaq() {
  const invalidate = useInvalidateHomeFaqs();
  return useMutation({
    mutationFn: (id: string) => deleteHomeFaqApi(id),
    onSuccess: invalidate,
  });
}

export function useReorderHomeFaqs() {
  const invalidate = useInvalidateHomeFaqs();
  return useMutation({
    mutationFn: (ids: string[]) => reorderHomeFaqsApi(ids),
    onSuccess: invalidate,
  });
}
