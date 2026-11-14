import type { Phlebotomist, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { PhlebotomistDto } from "../types/phlebotomist.types";

export interface ListPhlebotomistsFilter {
  search?: string;
  isActive?: string;
  cityId?: string;
  /** Scopes to phlebos a specific franchise created — set only by the
   *  franchise portal's own listing/assign-dropdown, never by the admin
   *  (unscoped) routes. See `Phlebotomist.createdByOrganizationId`. */
  createdByOrganizationId?: string;
  skip: number;
  take: number;
}

export interface PhlebotomistWriteInput {
  name: string;
  mobile: string;
  photoUrl?: string | null;
  isActive?: boolean;
  cityId?: string | null;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  serviceAreaIds?: string[];
  /** Set only when a franchise is creating this phlebo from its own portal
   *  — never passed by the admin create/update path. */
  createdByOrganizationId?: string | null;
}

const withRelations = {
  city: { select: { name: true } },
  serviceAreas: { include: { area: { select: { id: true, name: true } } } },
} satisfies Prisma.PhlebotomistInclude;

type PhlebotomistWithRelations = Phlebotomist & {
  city: { name: string } | null;
  serviceAreas: Array<{ area: { id: string; name: string } }>;
};

/** Maps a Prisma row to the exact shape the frontend expects. */
export function toPhlebotomistDto(phlebotomist: PhlebotomistWithRelations): PhlebotomistDto {
  return {
    id: phlebotomist.id,
    name: phlebotomist.name,
    mobile: phlebotomist.mobile,
    photoUrl: phlebotomist.photoUrl,
    isActive: phlebotomist.isActive,
    cityId: phlebotomist.cityId,
    cityName: phlebotomist.city?.name ?? null,
    workingHoursStart: phlebotomist.workingHoursStart,
    workingHoursEnd: phlebotomist.workingHoursEnd,
    serviceAreas: phlebotomist.serviceAreas.map((sa) => ({ id: sa.area.id, name: sa.area.name })),
    createdByOrganizationId: phlebotomist.createdByOrganizationId,
    createdAt: phlebotomist.createdAt.toISOString(),
    updatedAt: phlebotomist.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<
    ListPhlebotomistsFilter,
    "search" | "isActive" | "cityId" | "createdByOrganizationId"
  >,
): Prisma.PhlebotomistWhereInput {
  const where: Prisma.PhlebotomistWhereInput = {};

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { mobile: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }
  if (filter.cityId) {
    where.cityId = filter.cityId;
  }
  if (filter.createdByOrganizationId) {
    where.createdByOrganizationId = filter.createdByOrganizationId;
  }

  return where;
}

export async function listPhlebotomists(
  filter: ListPhlebotomistsFilter,
): Promise<{ rows: PhlebotomistWithRelations[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.phlebotomist.findMany({
      where,
      include: withRelations,
      orderBy: { name: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.phlebotomist.count({ where }),
  ]);

  return { rows, total };
}

/** Unpaginated, active-only — backs the basic assignment dropdown on Order
 *  Management (Order module needs the full list, not one page of it).
 *  `createdByOrganizationId`, when passed, is the franchise portal's
 *  equivalent — its assign-phlebo dropdown only offers phlebos that
 *  franchise itself created (see `Phlebotomist.createdByOrganizationId`'s
 *  doc-comment for why). */
export function listActivePhlebotomists(createdByOrganizationId?: string) {
  return prisma.phlebotomist.findMany({
    where: { isActive: true, ...(createdByOrganizationId ? { createdByOrganizationId } : {}) },
    include: withRelations,
    orderBy: { name: "asc" },
  });
}

/** Active phlebotomists covering a given area — used by the Slot
 *  Availability engine to derive per-area capacity. */
export function listActivePhlebotomistsByArea(areaId: string) {
  return prisma.phlebotomist.findMany({
    where: { isActive: true, serviceAreas: { some: { areaId } } },
  });
}

export function findPhlebotomistById(id: string) {
  return prisma.phlebotomist.findUnique({ where: { id }, include: withRelations });
}

async function writeServiceAreas(
  tx: Prisma.TransactionClient,
  phlebotomistId: string,
  areaIds: string[],
) {
  await tx.phlebotomistServiceArea.deleteMany({ where: { phlebotomistId } });
  if (areaIds.length > 0) {
    await tx.phlebotomistServiceArea.createMany({
      data: areaIds.map((areaId) => ({ phlebotomistId, areaId })),
    });
  }
}

export async function createPhlebotomist(data: PhlebotomistWriteInput) {
  const { serviceAreaIds, ...fields } = data;
  const created = await prisma.$transaction(async (tx) => {
    const phlebotomist = await tx.phlebotomist.create({
      data: { ...fields, isActive: fields.isActive ?? true },
    });
    if (serviceAreaIds) {
      await writeServiceAreas(tx, phlebotomist.id, serviceAreaIds);
    }
    return phlebotomist;
  });

  return findPhlebotomistById(created.id) as Promise<PhlebotomistWithRelations>;
}

export async function updatePhlebotomist(id: string, data: PhlebotomistWriteInput) {
  const { serviceAreaIds, ...fields } = data;
  await prisma.$transaction(async (tx) => {
    await tx.phlebotomist.update({ where: { id }, data: fields });
    if (serviceAreaIds) {
      await writeServiceAreas(tx, id, serviceAreaIds);
    }
  });

  return findPhlebotomistById(id) as Promise<PhlebotomistWithRelations>;
}

export function setPhlebotomistStatus(id: string, isActive: boolean) {
  return prisma.phlebotomist.update({ where: { id }, data: { isActive } });
}

export function deletePhlebotomist(id: string) {
  return prisma.phlebotomist.delete({ where: { id } });
}
