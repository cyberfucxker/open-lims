export const BLOG_POST_STATUS_VALUES = ["DRAFT", "PUBLISHED"] as const;
export type BlogPostStatus = (typeof BLOG_POST_STATUS_VALUES)[number];

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

/** The public shape patient-web reads — narrower than `BlogPostDto`: no
 *  `status`/timestamps a guest has no use for, nothing that would leak
 *  draft-workflow detail. */
export interface PublicBlogPostDto {
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  excerpt: string;
  body: string[];
  imageUrl: string | null;
  publishedAt: string | null;
}

export interface BlogPostWriteInput {
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  excerpt: string;
  body: string[];
  imageUrl?: string | null;
  status: BlogPostStatus;
}
