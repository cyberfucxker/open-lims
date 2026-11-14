import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";

/** Superadmin-authored content — see `GET /app/blog(/:slug)`. Public, no
 *  auth required (a guest reads articles before ever logging in). */
export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  excerpt: string;
  body: string[];
  imageUrl: string | null;
  publishedAt: string | null;
}

export interface ListBlogPostsResult {
  rows: BlogPost[];
  categories: string[];
  total: number;
}

export interface BlogPostDetail {
  post: BlogPost;
  related: BlogPost[];
}

export const blogApi = {
  async list(params?: { search?: string; category?: string }): Promise<ListBlogPostsResult> {
    const response = await httpClient.get<AppApiResponseBody<ListBlogPostsResult>>("/blog", {
      params,
    });
    return response.data.data ?? { rows: [], categories: [], total: 0 };
  },

  async getBySlug(slug: string): Promise<BlogPostDetail> {
    const response = await httpClient.get<AppApiResponseBody<BlogPostDetail>>(
      `/blog/${encodeURIComponent(slug)}`,
    );
    return response.data.data as BlogPostDetail;
  },
};
