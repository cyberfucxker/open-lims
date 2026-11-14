import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import * as webBannerRepository from "../repositories/webBanner.repository";
import { toWebBannerDto, type WebBannerWriteInput } from "../repositories/webBanner.repository";
import type {
  ListWebBannersParams,
  ListWebBannersResult,
  WebBannerDto,
} from "../types/webBanner.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Web banner not found");
    }
    throw error;
  }
}

/** A slide can promote a package or not, but it can't promote one that
 *  doesn't exist (or has been soft-deleted) — the patient side would render
 *  a price block for a package nobody can buy. */
async function assertPackageExists(packageId: string | null | undefined): Promise<void> {
  if (!packageId) return;
  const pkg = await prisma.package.findFirst({
    where: { id: packageId, deletedAt: null },
    select: { id: true },
  });
  if (!pkg) {
    throw ApiError.badRequest("Selected package does not exist");
  }
}

export async function listWebBanners(params: ListWebBannersParams): Promise<ListWebBannersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await webBannerRepository.listWebBanners({
    placement: params.placement,
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toWebBannerDto), total };
}

export async function getWebBanner(id: string): Promise<WebBannerDto> {
  const row = await webBannerRepository.findWebBannerById(id);
  if (!row) {
    throw ApiError.notFound("Web banner not found");
  }
  return toWebBannerDto(row);
}

export async function createWebBanner(values: WebBannerWriteInput): Promise<WebBannerDto> {
  await assertPackageExists(values.packageId);
  return toWebBannerDto(await webBannerRepository.createWebBanner(values));
}

export async function updateWebBanner(
  id: string,
  values: WebBannerWriteInput,
): Promise<WebBannerDto> {
  await assertPackageExists(values.packageId);
  return toWebBannerDto(
    await withTranslatedErrors(() => webBannerRepository.updateWebBanner(id, values)),
  );
}

export async function setWebBannerStatus(id: string, isActive: boolean): Promise<WebBannerDto> {
  return toWebBannerDto(
    await withTranslatedErrors(() => webBannerRepository.setWebBannerStatus(id, isActive)),
  );
}

export async function deleteWebBanner(id: string): Promise<void> {
  await withTranslatedErrors(() => webBannerRepository.deleteWebBanner(id));
}

export async function reorderWebBanners(ids: string[]): Promise<void> {
  await withTranslatedErrors(() => webBannerRepository.reorderWebBanners(ids));
}
