import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBlogPostApi,
  deleteBlogPostApi,
  fetchBlogPosts,
  updateBlogPostApi,
  type BlogPostFormValues,
  type BlogPostListParams,
} from "@/services/api/blogPostApi";

export function useBlogPosts(params: BlogPostListParams = {}) {
  return useQuery({
    queryKey: ["blog-posts", "list", params],
    queryFn: () => fetchBlogPosts(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateBlogPosts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["blog-posts", "list"] });
}

export function useCreateBlogPost() {
  const invalidate = useInvalidateBlogPosts();
  return useMutation({
    mutationFn: (values: BlogPostFormValues) => createBlogPostApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateBlogPost() {
  const invalidate = useInvalidateBlogPosts();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BlogPostFormValues }) =>
      updateBlogPostApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeleteBlogPost() {
  const invalidate = useInvalidateBlogPosts();
  return useMutation({
    mutationFn: (id: string) => deleteBlogPostApi(id),
    onSuccess: invalidate,
  });
}
