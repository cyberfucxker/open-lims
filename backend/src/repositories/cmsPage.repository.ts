import type { CmsAppType, CmsPage, CmsPageStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { CmsPageDto, CmsPageListItem } from "../types/cmsPage.types";

export interface ListCmsPagesFilter {
  appType?: CmsAppType;
  status?: CmsPageStatus;
  search?: string;
  skip: number;
  take: number;
}

export interface CmsPageWriteInput {
  appType: CmsAppType;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  status?: CmsPageStatus;
}

/** `/phlebo/<slug>` for the Phlebo App, plain `/<slug>` for the Patient App —
 *  matches the two apps' distinct public URL prefixes. */
export function buildPublicUrl(appType: CmsAppType, slug: string): string {
  return appType === "PHLEBO" ? `/phlebo/${slug}` : `/${slug}`;
}

export function toCmsPageDto(page: CmsPage): CmsPageDto {
  return {
    id: page.id,
    appType: page.appType,
    title: page.title,
    slug: page.slug,
    content: page.content,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
    publicUrl: buildPublicUrl(page.appType, page.slug),
    createdByUserId: page.createdByUserId,
    updatedByUserId: page.updatedByUserId,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function toCmsPageListItemDto(page: CmsPage): CmsPageListItem {
  return {
    id: page.id,
    appType: page.appType,
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle,
    status: page.status,
    publicUrl: buildPublicUrl(page.appType, page.slug),
    updatedAt: page.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListCmsPagesFilter, "appType" | "status" | "search">,
): Prisma.CmsPageWhereInput {
  const where: Prisma.CmsPageWhereInput = {};

  if (filter.appType) {
    where.appType = filter.appType;
  }
  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { slug: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listCmsPages(
  filter: ListCmsPagesFilter,
): Promise<{ rows: CmsPage[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.cmsPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.cmsPage.count({ where }),
  ]);

  return { rows, total };
}

export function findCmsPageById(id: string) {
  return prisma.cmsPage.findUnique({ where: { id } });
}

export function findCmsPageByAppTypeAndSlug(appType: CmsAppType, slug: string) {
  return prisma.cmsPage.findUnique({ where: { appType_slug: { appType, slug } } });
}

export function findPublishedCmsPage(appType: CmsAppType, slug: string) {
  return prisma.cmsPage.findFirst({ where: { appType, slug, status: "PUBLISHED" } });
}

function toPrismaData(data: CmsPageWriteInput) {
  return {
    appType: data.appType,
    title: data.title,
    slug: data.slug,
    content: data.content,
    metaTitle: data.metaTitle ?? null,
    metaDescription: data.metaDescription ?? null,
  };
}

export function createCmsPage(data: CmsPageWriteInput, createdByUserId: string | null) {
  return prisma.cmsPage.create({
    data: {
      ...toPrismaData(data),
      status: data.status ?? "DRAFT",
      createdByUserId,
      updatedByUserId: createdByUserId,
    },
  });
}

export function updateCmsPage(id: string, data: CmsPageWriteInput, updatedByUserId: string | null) {
  return prisma.cmsPage.update({
    where: { id },
    data: { ...toPrismaData(data), updatedByUserId },
  });
}

export function setCmsPageStatus(
  id: string,
  status: CmsPageStatus,
  updatedByUserId: string | null,
) {
  return prisma.cmsPage.update({ where: { id }, data: { status, updatedByUserId } });
}

export function deleteCmsPage(id: string) {
  return prisma.cmsPage.delete({ where: { id } });
}
