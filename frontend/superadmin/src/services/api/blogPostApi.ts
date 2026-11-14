import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export type BlogPostStatus = "DRAFT" | "PUBLISHED";

export interface BlogPostDto {
  id: string;
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  excerpt: string;
  body: string[];
  imageUrl: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostListParams {
  search?: string;
  status?: BlogPostStatus;
  page?: number;
  pageSize?: number;
}

export interface BlogPostFormValues {
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  excerpt: string;
  body: string[];
  imageUrl?: string | null;
  status: BlogPostStatus;
}

export async function fetchBlogPosts(
  params: BlogPostListParams = {},
): Promise<PaginatedResult<BlogPostDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<BlogPostDto>>>(
    "/blog-posts",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<BlogPostDto>;
}

export async function createBlogPostApi(values: BlogPostFormValues): Promise<BlogPostDto> {
  const response = await httpClient.post<ApiResponseBody<BlogPostDto>>("/blog-posts", values, {
    suppressErrorToast: true,
  });
  return response.data.data as BlogPostDto;
}

export async function updateBlogPostApi(
  id: string,
  values: BlogPostFormValues,
): Promise<BlogPostDto> {
  const response = await httpClient.put<ApiResponseBody<BlogPostDto>>(`/blog-posts/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as BlogPostDto;
}

export async function deleteBlogPostApi(id: string): Promise<void> {
  await httpClient.delete(`/blog-posts/${id}`, { suppressErrorToast: true });
}

/** Same uploader and same `/uploads` store the app/web banners use. */
export async function uploadBlogPostImageApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await httpClient.post<ApiResponseBody<{ url: string }>>(
    "/blog-posts/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return (response.data.data as { url: string }).url;
}
