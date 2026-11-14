import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as blogPostRepository from "../repositories/blogPost.repository";
import { toBlogPostDto, toPublicBlogPostDto } from "../repositories/blogPost.repository";
import type {
  BlogPostDto,
  BlogPostStatus,
  BlogPostWriteInput,
  PublicBlogPostDto,
} from "../types/blogPost.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw ApiError.notFound("Blog post not found");
      if (error.code === "P2002")
        throw ApiError.conflict("A blog post with this slug already exists");
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Admin (Superadmin CMS)
// ---------------------------------------------------------------------------

export interface ListBlogPostsParams {
  search?: string;
  status?: BlogPostStatus;
  page?: number;
  pageSize?: number;
}

export interface ListBlogPostsResult {
  rows: BlogPostDto[];
  total: number;
}

export async function listBlogPosts(params: ListBlogPostsParams): Promise<ListBlogPostsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await blogPostRepository.listBlogPosts({
    search: params.search,
    status: params.status,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toBlogPostDto), total };
}

export async function getBlogPost(id: string): Promise<BlogPostDto> {
  const row = await blogPostRepository.findBlogPostById(id);
  if (!row) throw ApiError.notFound("Blog post not found");
  return toBlogPostDto(row);
}

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const existing = await blogPostRepository.findBlogPostBySlug(slug);
  if (existing && existing.id !== excludeId) {
    throw ApiError.conflict("A blog post with this slug already exists");
  }
}

export async function createBlogPost(values: BlogPostWriteInput): Promise<BlogPostDto> {
  await assertSlugAvailable(values.slug);
  return toBlogPostDto(await blogPostRepository.createBlogPost(values));
}

export async function updateBlogPost(id: string, values: BlogPostWriteInput): Promise<BlogPostDto> {
  await assertSlugAvailable(values.slug, id);

  // Only stamp `publishedAt` the moment a post FIRST goes live — every later
  // edit (even a status round-trip back to DRAFT and PUBLISHED again) should
  // not read as "published just now".
  const current = await blogPostRepository.findBlogPostById(id);
  if (!current) throw ApiError.notFound("Blog post not found");
  const publishedAt =
    values.status === "PUBLISHED" && !current.publishedAt ? new Date() : undefined;

  return toBlogPostDto(
    await withTranslatedErrors(() => blogPostRepository.updateBlogPost(id, values, publishedAt)),
  );
}

export async function deleteBlogPost(id: string): Promise<void> {
  await withTranslatedErrors(() => blogPostRepository.deleteBlogPost(id));
}

// ---------------------------------------------------------------------------
// Public (patient-web /blog, /blog/:slug) — published only
// ---------------------------------------------------------------------------

export interface ListPublicBlogPostsParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ListPublicBlogPostsResult {
  rows: PublicBlogPostDto[];
  categories: string[];
  total: number;
}

export async function listPublicBlogPosts(
  params: ListPublicBlogPostsParams,
): Promise<ListPublicBlogPostsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  // Patient-web currently renders the whole list client-side-filtered — a
  // generous default page size keeps that working without pagination UI
  // until the post count outgrows it.
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 100;

  const [{ rows, total }, categoryRows] = await Promise.all([
    blogPostRepository.listPublicBlogPosts({
      search: params.search,
      category: params.category,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    blogPostRepository.listPublicBlogCategories(),
  ]);

  return {
    rows: rows.map(toPublicBlogPostDto),
    categories: categoryRows.map((c) => c.category),
    total,
  };
}

export interface PublicBlogPostDetail {
  post: PublicBlogPostDto;
  related: PublicBlogPostDto[];
}

export async function getPublicBlogPostBySlug(slug: string): Promise<PublicBlogPostDetail> {
  const row = await blogPostRepository.findPublishedBlogPostBySlug(slug);
  if (!row) throw ApiError.notFound("Article not found");

  const related = await blogPostRepository.listRelatedPublishedBlogPosts(row.category, row.slug);

  return { post: toPublicBlogPostDto(row), related: related.map(toPublicBlogPostDto) };
}
