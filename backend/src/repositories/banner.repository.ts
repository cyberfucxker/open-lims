import type { Banner, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { BannerDto } from "../types/banner.types";

export interface ListBannersFilter {
  isActive?: string;
  skip: number;
  take: number;
}

export interface BannerWriteInput {
  imageUrl: string;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}

export function toBannerDto(banner: Banner): BannerDto {
  return {
    id: banner.id,
    imageUrl: banner.imageUrl,
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
    validFrom: banner.validFrom ? banner.validFrom.toISOString() : null,
    validUntil: banner.validUntil ? banner.validUntil.toISOString() : null,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  };
}

function buildWhere(filter: Pick<ListBannersFilter, "isActive">): Prisma.BannerWhereInput {
  const where: Prisma.BannerWhereInput = {};

  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }

  return where;
}

export async function listBanners(
  filter: ListBannersFilter,
): Promise<{ rows: Banner[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.banner.count({ where }),
  ]);

  return { rows, total };
}

export function findBannerById(id: string) {
  return prisma.banner.findUnique({ where: { id } });
}

export async function nextSortOrder(): Promise<number> {
  const last = await prisma.banner.findFirst({ orderBy: { sortOrder: "desc" } });
  return (last?.sortOrder ?? -1) + 1;
}

function toWriteData(data: BannerWriteInput) {
  return {
    imageUrl: data.imageUrl,
    isActive: data.isActive,
    validFrom: data.validFrom
      ? new Date(data.validFrom)
      : data.validFrom === null
        ? null
        : undefined,
    validUntil: data.validUntil
      ? new Date(data.validUntil)
      : data.validUntil === null
        ? null
        : undefined,
  };
}

export async function createBanner(data: BannerWriteInput) {
  const sortOrder = await nextSortOrder();
  return prisma.banner.create({
    data: { ...toWriteData(data), sortOrder, isActive: data.isActive ?? true },
  });
}

export function updateBanner(id: string, data: BannerWriteInput) {
  return prisma.banner.update({ where: { id }, data: toWriteData(data) });
}

export function setBannerStatus(id: string, isActive: boolean) {
  return prisma.banner.update({ where: { id }, data: { isActive } });
}

export function deleteBanner(id: string) {
  return prisma.banner.delete({ where: { id } });
}

export function reorderBanners(ids: string[]) {
  return prisma.$transaction(
    ids.map((id, index) => prisma.banner.update({ where: { id }, data: { sortOrder: index } })),
  );
}
