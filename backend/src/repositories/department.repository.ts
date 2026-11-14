import type { Department, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { DepartmentDto } from "../types/master.types";

export interface ListDepartmentsFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface DepartmentWriteInput {
  name: string;
  code?: string | null;
  description?: string | null;
  active?: boolean;
}

const SORTABLE_FIELDS = new Set(["name", "code", "active", "createdAt", "updatedAt"]);

/** Maps a Prisma row to the exact shape the frontend expects. */
export function toDepartmentDto(department: Department): DepartmentDto {
  return {
    id: department.id,
    name: department.name,
    code: department.code,
    description: department.description,
    active: department.active,
    deletedAt: department.deletedAt ? department.deletedAt.toISOString() : null,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListDepartmentsFilter, "search" | "active" | "includeDeleted">,
): Prisma.DepartmentWhereInput {
  const where: Prisma.DepartmentWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
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

function buildOrderBy(
  sortBy?: string,
  sortDir?: string,
): Prisma.DepartmentOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listDepartments(
  filter: ListDepartmentsFilter,
): Promise<{ rows: Department[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.department.findMany({
      where,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.department.count({ where }),
  ]);

  return { rows, total };
}

export function findDepartmentById(id: string) {
  return prisma.department.findFirst({ where: { id, deletedAt: null } });
}

export function createDepartment(data: DepartmentWriteInput) {
  return prisma.department.create({
    data: { ...data, active: data.active ?? true },
  });
}

export function updateDepartment(id: string, data: DepartmentWriteInput) {
  return prisma.department.update({ where: { id }, data });
}

export function softDeleteDepartment(id: string) {
  return prisma.department.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export function restoreDepartment(id: string) {
  return prisma.department.update({ where: { id }, data: { deletedAt: null } });
}

export function setDepartmentStatus(id: string, active: boolean) {
  return prisma.department.update({ where: { id }, data: { active } });
}
