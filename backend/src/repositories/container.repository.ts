import type { Container, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { ContainerDto } from "../types/master.types";

export interface ListContainersFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface ContainerWriteInput {
  name: string;
  code?: string | null;
  color?: string | null;
  description?: string | null;
  active?: boolean;
}

const SORTABLE_FIELDS = new Set(["name", "code", "active", "createdAt", "updatedAt"]);

/** Maps a Prisma row to the exact shape the frontend expects. */
export function toContainerDto(container: Container): ContainerDto {
  return {
    id: container.id,
    name: container.name,
    code: container.code,
    color: container.color,
    description: container.description,
    active: container.active,
    deletedAt: container.deletedAt ? container.deletedAt.toISOString() : null,
    createdAt: container.createdAt.toISOString(),
    updatedAt: container.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListContainersFilter, "search" | "active" | "includeDeleted">,
): Prisma.ContainerWhereInput {
  const where: Prisma.ContainerWhereInput = {};

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

function buildOrderBy(sortBy?: string, sortDir?: string): Prisma.ContainerOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listContainers(
  filter: ListContainersFilter,
): Promise<{ rows: Container[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.container.findMany({
      where,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.container.count({ where }),
  ]);

  return { rows, total };
}

export function findContainerById(id: string) {
  return prisma.container.findFirst({ where: { id, deletedAt: null } });
}

export function createContainer(data: ContainerWriteInput) {
  return prisma.container.create({
    data: { ...data, active: data.active ?? true },
  });
}

export function updateContainer(id: string, data: ContainerWriteInput) {
  return prisma.container.update({ where: { id }, data });
}

export function softDeleteContainer(id: string) {
  return prisma.container.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
}

export function restoreContainer(id: string) {
  return prisma.container.update({ where: { id }, data: { deletedAt: null } });
}

export function setContainerStatus(id: string, active: boolean) {
  return prisma.container.update({ where: { id }, data: { active } });
}
