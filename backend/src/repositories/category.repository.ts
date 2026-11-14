import type { Category, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { CategoryDto } from "../types/master.types";

type CategoryWithDepartment = Category & { department: { name: string } };

export interface ListCategoriesFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  departmentId?: string;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface CategoryWriteInput {
  departmentId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  active?: boolean;
}

const SORTABLE_FIELDS = new Set(["name", "code", "active", "createdAt", "updatedAt"]);

/** Maps a Prisma row (with its department relation loaded) to the exact
 *  shape the frontend expects — `department` is the department's display
 *  name, not the raw id, so list/detail views don't need a second lookup. */
export function toCategoryDto(category: CategoryWithDepartment): CategoryDto {
  return {
    id: category.id,
    departmentId: category.departmentId,
    department: category.department.name,
    name: category.name,
    code: category.code,
    description: category.description,
    active: category.active,
    deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListCategoriesFilter, "search" | "active" | "includeDeleted" | "departmentId">,
): Prisma.CategoryWhereInput {
  const where: Prisma.CategoryWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.departmentId) {
    where.departmentId = filter.departmentId;
  }
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { code: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.active === "true") {
    where.active = true;
  } else if (filter.active === "false") {
    where.active = false;
  }

  return where;
}

function buildOrderBy(sortBy?: string, sortDir?: string): Prisma.CategoryOrderByWithRelationInput {
  const direction = sortDir === "asc" ? "asc" : "desc";
  if (sortBy === "department") {
    return { department: { name: direction } };
  }
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: direction };
}

export async function listCategories(
  filter: ListCategoriesFilter,
): Promise<{ rows: CategoryWithDepartment[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.category.count({ where }),
  ]);

  return { rows, total };
}

export function findCategoryById(id: string) {
  return prisma.category.findFirst({
    where: { id, deletedAt: null },
    include: { department: { select: { name: true } } },
  });
}

export function createCategory(data: CategoryWriteInput) {
  return prisma.category.create({
    data: { ...data, active: data.active ?? true },
    include: { department: { select: { name: true } } },
  });
}

export function updateCategory(id: string, data: CategoryWriteInput) {
  return prisma.category.update({
    where: { id },
    data,
    include: { department: { select: { name: true } } },
  });
}

export function softDeleteCategory(id: string) {
  return prisma.category.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
    include: { department: { select: { name: true } } },
  });
}

export function restoreCategory(id: string) {
  return prisma.category.update({
    where: { id },
    data: { deletedAt: null },
    include: { department: { select: { name: true } } },
  });
}

export function setCategoryStatus(id: string, active: boolean) {
  return prisma.category.update({
    where: { id },
    data: { active },
    include: { department: { select: { name: true } } },
  });
}
