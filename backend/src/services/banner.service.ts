import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as bannerRepository from "../repositories/banner.repository";
import { toBannerDto, type BannerWriteInput } from "../repositories/banner.repository";
import type { BannerDto, ListBannersParams, ListBannersResult } from "../types/banner.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Banner not found");
    }
    throw error;
  }
}

export async function listBanners(params: ListBannersParams): Promise<ListBannersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await bannerRepository.listBanners({
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toBannerDto), total };
}

export async function getBanner(id: string): Promise<BannerDto> {
  const banner = await bannerRepository.findBannerById(id);
  if (!banner) {
    throw ApiError.notFound("Banner not found");
  }
  return toBannerDto(banner);
}

function assertValidDateRange(values: BannerWriteInput) {
  if (
    values.validFrom &&
    values.validUntil &&
    new Date(values.validUntil) < new Date(values.validFrom)
  ) {
    throw ApiError.badRequest("Valid-until date must be after the valid-from date");
  }
}

export async function createBanner(values: BannerWriteInput): Promise<BannerDto> {
  assertValidDateRange(values);
  const banner = await bannerRepository.createBanner(values);
  return toBannerDto(banner);
}

export async function updateBanner(id: string, values: BannerWriteInput): Promise<BannerDto> {
  assertValidDateRange(values);
  const banner = await withTranslatedErrors(() => bannerRepository.updateBanner(id, values));
  return toBannerDto(banner);
}

export async function setBannerStatus(id: string, isActive: boolean): Promise<BannerDto> {
  const banner = await withTranslatedErrors(() => bannerRepository.setBannerStatus(id, isActive));
  return toBannerDto(banner);
}

export async function deleteBanner(id: string): Promise<void> {
  await withTranslatedErrors(() => bannerRepository.deleteBanner(id));
}

export async function reorderBanners(ids: string[]): Promise<void> {
  await withTranslatedErrors(() => bannerRepository.reorderBanners(ids));
}
