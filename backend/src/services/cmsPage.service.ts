import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as cmsPageRepository from "../repositories/cmsPage.repository";
import { toCmsPageDto, toCmsPageListItemDto } from "../repositories/cmsPage.repository";
import type {
  CmsAppType,
  CmsPageDto,
  CmsPageStatus,
  CmsPageWriteData,
  ListCmsPagesParams,
  ListCmsPagesResult,
  PublicCmsPageDto,
} from "../types/cmsPage.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Page not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict(
          "A page with this slug already exists for this app. Choose a different slug.",
        );
      }
    }
    throw error;
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Only used by "Duplicate Page" — the admin never types the copy's slug, so
 *  unlike create/update (which surface a P2002 conflict for the admin to
 *  fix), this silently finds the next free `-copy`/`-copy-2`/... suffix. */
async function resolveUniqueSlug(
  appType: CmsAppType,
  baseSlug: string,
  attempt = 1,
): Promise<string> {
  const candidate = attempt === 1 ? `${baseSlug}-copy` : `${baseSlug}-copy-${attempt}`;
  const existing = await cmsPageRepository.findCmsPageByAppTypeAndSlug(appType, candidate);
  if (!existing) return candidate;
  return resolveUniqueSlug(appType, baseSlug, attempt + 1);
}

export async function listCmsPages(params: ListCmsPagesParams): Promise<ListCmsPagesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await cmsPageRepository.listCmsPages({
    appType: params.appType,
    status: params.status,
    search: params.search,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toCmsPageListItemDto), total };
}

export async function getCmsPage(id: string): Promise<CmsPageDto> {
  const page = await cmsPageRepository.findCmsPageById(id);
  if (!page) {
    throw ApiError.notFound("Page not found");
  }
  return toCmsPageDto(page);
}

export async function createCmsPage(
  values: CmsPageWriteData,
  userId: string | null,
): Promise<CmsPageDto> {
  const slug = slugify(values.slug?.trim() || values.title);
  if (!slug) {
    throw ApiError.badRequest("Enter a title or slug to derive a URL from");
  }

  const page = await withTranslatedErrors(() =>
    cmsPageRepository.createCmsPage({ ...values, slug }, userId),
  );
  return toCmsPageDto(page);
}

export async function updateCmsPage(
  id: string,
  values: CmsPageWriteData,
  userId: string | null,
): Promise<CmsPageDto> {
  const slug = slugify(values.slug?.trim() || values.title);
  if (!slug) {
    throw ApiError.badRequest("Enter a title or slug to derive a URL from");
  }

  const page = await withTranslatedErrors(() =>
    cmsPageRepository.updateCmsPage(id, { ...values, slug }, userId),
  );
  return toCmsPageDto(page);
}

export async function setCmsPageStatus(
  id: string,
  status: CmsPageStatus,
  userId: string | null,
): Promise<CmsPageDto> {
  const page = await withTranslatedErrors(() =>
    cmsPageRepository.setCmsPageStatus(id, status, userId),
  );
  return toCmsPageDto(page);
}

export async function duplicateCmsPage(id: string, userId: string | null): Promise<CmsPageDto> {
  const original = await cmsPageRepository.findCmsPageById(id);
  if (!original) {
    throw ApiError.notFound("Page not found");
  }

  const slug = await resolveUniqueSlug(original.appType, original.slug);
  const page = await withTranslatedErrors(() =>
    cmsPageRepository.createCmsPage(
      {
        appType: original.appType,
        title: `${original.title} (Copy)`,
        slug,
        content: original.content,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        status: "DRAFT",
      },
      userId,
    ),
  );
  return toCmsPageDto(page);
}

export async function deleteCmsPage(id: string): Promise<void> {
  const page = await cmsPageRepository.findCmsPageById(id);
  if (!page) {
    throw ApiError.notFound("Page not found");
  }
  await withTranslatedErrors(() => cmsPageRepository.deleteCmsPage(id));
}

export async function getPublishedCmsPage(
  appType: CmsAppType,
  slug: string,
): Promise<PublicCmsPageDto> {
  const page = await cmsPageRepository.findPublishedCmsPage(appType, slug.toLowerCase());
  if (!page) {
    throw ApiError.notFound("Page not found");
  }
  return {
    title: page.title,
    slug: page.slug,
    content: page.content,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    updatedAt: page.updatedAt.toISOString(),
  };
}
