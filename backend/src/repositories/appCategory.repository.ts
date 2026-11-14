import type { AppCategory, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { AppCategoryDto } from "../types/appCategory.types";

export interface ListAppCategoriesFilter {
  search?: string;
  isActive?: string;
  skip: number;
  take: number;
}

export interface AppCategoryWriteInput {
  name: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
}

export function toAppCategoryDto(category: AppCategory): AppCategoryDto {
  return {
    id: category.id,
    name: category.name,
    imageUrl: category.imageUrl,
    thumbnailUrl: category.thumbnailUrl,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListAppCategoriesFilter, "search" | "isActive">,
): Prisma.AppCategoryWhereInput {
  const where: Prisma.AppCategoryWhereInput = {};

  if (filter.search) {
    where.name = { contains: filter.search, mode: "insensitive" };
  }
  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }

  return where;
}

export async function listAppCategories(
  filter: ListAppCategoriesFilter,
): Promise<{ rows: AppCategory[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.appCategory.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.appCategory.count({ where }),
  ]);

  return { rows, total };
}

export function findAppCategoryById(id: string) {
  return prisma.appCategory.findUnique({ where: { id } });
}

export async function nextSortOrder(): Promise<number> {
  const last = await prisma.appCategory.findFirst({ orderBy: { sortOrder: "desc" } });
  return (last?.sortOrder ?? -1) + 1;
}

export async function createAppCategory(data: AppCategoryWriteInput) {
  const sortOrder = await nextSortOrder();
  return prisma.appCategory.create({
    data: { ...data, sortOrder, isActive: data.isActive ?? true },
  });
}

export function updateAppCategory(id: string, data: AppCategoryWriteInput) {
  return prisma.appCategory.update({ where: { id }, data });
}

export function setAppCategoryStatus(id: string, isActive: boolean) {
  return prisma.appCategory.update({ where: { id }, data: { isActive } });
}

export function deleteAppCategory(id: string) {
  return prisma.appCategory.delete({ where: { id } });
}

export function reorderAppCategories(ids: string[]) {
  return prisma.$transaction(
    ids.map((id, index) =>
      prisma.appCategory.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
}
