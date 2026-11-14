import type { Prisma, BlogPostStatus } from "@prisma/client";
import { prisma } from "../config/database";
import type { BlogPostDto, BlogPostWriteInput, PublicBlogPostDto } from "../types/blogPost.types";

export type BlogPostRow = Prisma.BlogPostGetPayload<Record<string, never>>;

export interface ListBlogPostsFilter {
  search?: string;
  status?: BlogPostStatus;
  skip: number;
  take: number;
}

export function toBlogPostDto(row: BlogPostRow): BlogPostDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    readMinutes: row.readMinutes,
    excerpt: row.excerpt,
    body: row.body,
    imageUrl: row.imageUrl,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPublicBlogPostDto(row: BlogPostRow): PublicBlogPostDto {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    readMinutes: row.readMinutes,
    excerpt: row.excerpt,
    body: row.body,
    imageUrl: row.imageUrl,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

function buildWhere(
  filter: Pick<ListBlogPostsFilter, "search" | "status">,
): Prisma.BlogPostWhereInput {
  const where: Prisma.BlogPostWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { category: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listBlogPosts(
  filter: ListBlogPostsFilter,
): Promise<{ rows: BlogPostRow[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { rows, total };
}

export function findBlogPostById(id: string) {
  return prisma.blogPost.findUnique({ where: { id } });
}

export function findBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({ where: { slug } });
}

export function findPublishedBlogPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, status: "PUBLISHED" } });
}

/** Other published posts in the same category — the "Related articles"
 *  strip on the detail page. Newest first, excluding the post itself. */
export function listRelatedPublishedBlogPosts(
  category: string,
  excludeSlug: string,
  limit = 3,
): Promise<BlogPostRow[]> {
  return prisma.blogPost.findMany({
    where: { category, status: "PUBLISHED", slug: { not: excludeSlug } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export interface ListPublicBlogPostsFilter {
  search?: string;
  category?: string;
  skip: number;
  take: number;
}

export async function listPublicBlogPosts(
  filter: ListPublicBlogPostsFilter,
): Promise<{ rows: BlogPostRow[]; total: number }> {
  const where: Prisma.BlogPostWhereInput = { status: "PUBLISHED" };
  if (filter.category) where.category = filter.category;
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { excerpt: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { rows, total };
}

export function listPublicBlogCategories(): Promise<{ category: string }[]> {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
}

function toWriteData(data: BlogPostWriteInput, publishedAt: Date | null | undefined) {
  return {
    slug: data.slug,
    title: data.title,
    category: data.category,
    readMinutes: data.readMinutes,
    excerpt: data.excerpt,
    body: data.body,
    imageUrl: data.imageUrl ?? null,
    status: data.status,
    ...(publishedAt !== undefined ? { publishedAt } : {}),
  };
}

export function createBlogPost(data: BlogPostWriteInput) {
  return prisma.blogPost.create({
    data: toWriteData(data, data.status === "PUBLISHED" ? new Date() : null),
  });
}

/** `publishedAt` is only touched when the caller explicitly resolved a new
 *  value (service layer decides whether this edit is the first time the
 *  post goes live) — `undefined` here means "leave it exactly as it was". */
export function updateBlogPost(id: string, data: BlogPostWriteInput, publishedAt?: Date | null) {
  return prisma.blogPost.update({ where: { id }, data: toWriteData(data, publishedAt) });
}

export function deleteBlogPost(id: string) {
  return prisma.blogPost.delete({ where: { id } });
}
