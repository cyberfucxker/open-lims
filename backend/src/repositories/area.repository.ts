import type { Area, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { AreaDto } from "../types/area.types";

type AreaWithCity = Area & { city: { name: string } };

export interface ListAreasFilter {
  cityId?: string;
  search?: string;
  isActive?: string;
  skip: number;
  take: number;
}

export interface AreaWriteInput {
  cityId: string;
  name: string;
  pincodes?: string[];
  isActive?: boolean;
}

export function toAreaDto(area: AreaWithCity): AreaDto {
  return {
    id: area.id,
    cityId: area.cityId,
    cityName: area.city.name,
    name: area.name,
    pincodes: area.pincodes,
    isActive: area.isActive,
    phlebotomyCharge: area.phlebotomyCharge != null ? Number(area.phlebotomyCharge) : null,
    createdAt: area.createdAt.toISOString(),
    updatedAt: area.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListAreasFilter, "cityId" | "search" | "isActive">,
): Prisma.AreaWhereInput {
  const where: Prisma.AreaWhereInput = {};

  if (filter.cityId) {
    where.cityId = filter.cityId;
  }
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

export async function listAreas(
  filter: ListAreasFilter,
): Promise<{ rows: AreaWithCity[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.area.findMany({
      where,
      include: { city: { select: { name: true } } },
      orderBy: { name: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.area.count({ where }),
  ]);

  return { rows, total };
}

export function findAreaById(id: string) {
  return prisma.area.findUnique({ where: { id }, include: { city: { select: { name: true } } } });
}

/** Existence check for a batch of ids — used when a caller assigns a set of
 *  Areas to something else (e.g. a franchise's `OrganizationServiceArea`
 *  rows) and needs to reject any id that doesn't resolve to a real Area. */
export function countAreasByIds(ids: string[]) {
  return prisma.area.count({ where: { id: { in: ids } } });
}

export function createArea(data: AreaWriteInput) {
  return prisma.area.create({
    data: {
      cityId: data.cityId,
      name: data.name,
      pincodes: data.pincodes ?? [],
      isActive: data.isActive ?? true,
    },
    include: { city: { select: { name: true } } },
  });
}

export function updateArea(id: string, data: AreaWriteInput) {
  return prisma.area.update({
    where: { id },
    data: {
      cityId: data.cityId,
      name: data.name,
      pincodes: data.pincodes ?? [],
      isActive: data.isActive,
    },
    include: { city: { select: { name: true } } },
  });
}

export function setAreaStatus(id: string, isActive: boolean) {
  return prisma.area.update({
    where: { id },
    data: { isActive },
    include: { city: { select: { name: true } } },
  });
}

/** Separate from `updateArea` on purpose — the existing Area edit form
 *  (name/pincodes/status) doesn't know about this field, so folding it into
 *  the generic update would silently wipe the override on every unrelated
 *  edit. `phlebotomyCharge: null` explicitly resets to "inherit city rate". */
export function setAreaPhlebotomyCharge(id: string, phlebotomyCharge: number | null) {
  return prisma.area.update({
    where: { id },
    data: { phlebotomyCharge },
    include: { city: { select: { name: true } } },
  });
}

export function deleteArea(id: string) {
  return prisma.area.delete({ where: { id } });
}
