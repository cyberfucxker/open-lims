import type { Center, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { CenterDto } from "../types/master.types";

export interface ListCentersFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface CenterWriteInput {
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  active?: boolean;
}

const SORTABLE_FIELDS = new Set(["name", "code", "city", "active", "createdAt", "updatedAt"]);

/** Maps a Prisma row to the exact shape the frontend expects. */
export function toCenterDto(center: Center): CenterDto {
  return {
    id: center.id,
    name: center.name,
    code: center.code,
    address: center.address,
    city: center.city,
    active: center.active,
    deletedAt: center.deletedAt ? center.deletedAt.toISOString() : null,
    createdAt: center.createdAt.toISOString(),
    updatedAt: center.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListCentersFilter, "search" | "active" | "includeDeleted">,
): Prisma.CenterWhereInput {
  const where: Prisma.CenterWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { code: { contains: filter.search, mode: "insensitive" } },
      { city: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.active === "true") {
    where.active = true;
  } else if (filter.active === "false") {
    where.active = false;
  }

  return where;
}

function buildOrderBy(sortBy?: string, sortDir?: string): Prisma.CenterOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listCenters(
  filter: ListCentersFilter,
): Promise<{ rows: Center[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.center.findMany({
      where,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.center.count({ where }),
  ]);

  return { rows, total };
}

export function listActiveCenters() {
  return prisma.center.findMany({
    where: { active: true, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export function findCenterById(id: string) {
  return prisma.center.findFirst({ where: { id, deletedAt: null } });
}

export function createCenter(data: CenterWriteInput) {
  return prisma.center.create({
    data: { ...data, active: data.active ?? true },
  });
}

export function updateCenter(id: string, data: CenterWriteInput) {
  return prisma.center.update({ where: { id }, data });
}

export function softDeleteCenter(id: string) {
  return prisma.center.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export function restoreCenter(id: string) {
  return prisma.center.update({ where: { id }, data: { deletedAt: null } });
}

export function setCenterStatus(id: string, active: boolean) {
  return prisma.center.update({ where: { id }, data: { active } });
}
