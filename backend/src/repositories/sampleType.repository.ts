import type { Prisma, SampleType } from "@prisma/client";
import { prisma } from "../config/database";
import type { SampleTypeDto } from "../types/master.types";

export interface ListSampleTypesFilter {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface SampleTypeWriteInput {
  name: string;
  description?: string | null;
  active?: boolean;
}

const SORTABLE_FIELDS = new Set(["name", "active", "createdAt", "updatedAt"]);

export function toSampleTypeDto(sampleType: SampleType): SampleTypeDto {
  return {
    id: sampleType.id,
    name: sampleType.name,
    description: sampleType.description,
    active: sampleType.active,
    deletedAt: sampleType.deletedAt ? sampleType.deletedAt.toISOString() : null,
    createdAt: sampleType.createdAt.toISOString(),
    updatedAt: sampleType.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListSampleTypesFilter, "search" | "active" | "includeDeleted">,
): Prisma.SampleTypeWhereInput {
  const where: Prisma.SampleTypeWhereInput = {};

  if (!filter.includeDeleted) {
    where.deletedAt = null;
  }
  if (filter.search) {
    where.name = { contains: filter.search, mode: "insensitive" };
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
): Prisma.SampleTypeOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listSampleTypes(
  filter: ListSampleTypesFilter,
): Promise<{ rows: SampleType[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.sampleType.findMany({
      where,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.sampleType.count({ where }),
  ]);

  return { rows, total };
}

export function findSampleTypeById(id: string) {
  return prisma.sampleType.findFirst({ where: { id, deletedAt: null } });
}

export function createSampleType(data: SampleTypeWriteInput) {
  return prisma.sampleType.create({ data: { ...data, active: data.active ?? true } });
}

export function updateSampleType(id: string, data: SampleTypeWriteInput) {
  return prisma.sampleType.update({ where: { id }, data });
}

export function softDeleteSampleType(id: string) {
  return prisma.sampleType.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export function restoreSampleType(id: string) {
  return prisma.sampleType.update({ where: { id }, data: { deletedAt: null } });
}

export function setSampleTypeStatus(id: string, active: boolean) {
  return prisma.sampleType.update({ where: { id }, data: { active } });
}

/** What still points at this sample type. Deletion here is a SOFT delete, so
 *  Postgres' own `ON DELETE RESTRICT` never fires to stop it — a soft-deleted
 *  type would silently vanish from the Test form's dropdown while every test
 *  still referencing it kept an unresolvable `sampleTypeId`. This is the
 *  pre-flight check that turns that into an explanatory 409 instead. */
export async function countSampleTypeUsage(id: string) {
  const [testCount, sampleCount] = await Promise.all([
    prisma.test.count({ where: { sampleTypeId: id } }),
    prisma.sample.count({ where: { sampleTypeId: id } }),
  ]);
  return { testCount, sampleCount };
}
