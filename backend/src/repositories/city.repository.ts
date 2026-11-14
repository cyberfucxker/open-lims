import type { City, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { CityDto } from "../types/master.types";

export interface ListCitiesFilter {
  search?: string;
  active?: string;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface CityWriteInput {
  name: string;
  slug: string;
  stateId: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

type CityWithState = City & { state: { name: string } };

const SORTABLE_FIELDS = new Set(["name", "isActive", "isFeatured"]);

export function toCityDto(city: CityWithState): CityDto {
  return {
    id: city.id,
    name: city.name,
    slug: city.slug,
    stateId: city.stateId,
    stateName: city.state.name,
    isActive: city.isActive,
    isFeatured: city.isFeatured,
  };
}

function buildWhere(filter: Pick<ListCitiesFilter, "search" | "active">): Prisma.CityWhereInput {
  const where: Prisma.CityWhereInput = {};

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { slug: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.active === "true") {
    where.isActive = true;
  } else if (filter.active === "false") {
    where.isActive = false;
  }

  return where;
}

function buildOrderBy(sortBy?: string, sortDir?: string): Prisma.CityOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "name";
  return { [field]: sortDir === "desc" ? "desc" : "asc" };
}

export async function listCities(
  filter: ListCitiesFilter,
): Promise<{ rows: CityWithState[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.city.findMany({
      where,
      include: { state: { select: { name: true } } },
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.city.count({ where }),
  ]);

  return { rows, total };
}

export function findCityById(id: string) {
  return prisma.city.findUnique({
    where: { id },
    include: { state: { select: { name: true } } },
  });
}

export function findCityBySlug(slug: string) {
  return prisma.city.findUnique({ where: { slug }, select: { id: true } });
}

export function createCity(data: CityWriteInput) {
  return prisma.city.create({
    data: {
      name: data.name,
      slug: data.slug,
      stateId: data.stateId,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
    },
    include: { state: { select: { name: true } } },
  });
}

/** Slug is generated once at creation, same convention as `Test.slug`/
 *  `Package.slug` — never re-derived on rename, so an already-shared/
 *  indexed `/{citySlug}` url never 404s out from under itself. */
export function updateCity(id: string, data: Omit<CityWriteInput, "slug">) {
  return prisma.city.update({
    where: { id },
    data: {
      name: data.name,
      stateId: data.stateId,
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
    },
    include: { state: { select: { name: true } } },
  });
}

/** `City` has no `deletedAt` — this master has real, active downstream data
 *  (AppUser/Prescription/Organization/Area/Phlebotomist all FK onto it) as
 *  soon as it's ever been live, so a real `DELETE` would fail loudly the
 *  moment any of that exists. Deactivating (`isActive: false`) is the actual
 *  "remove" here: it drops out of the app's `/master/cities` list and the
 *  live sitemap (see `sitemapGenerator.service.ts`) without breaking
 *  anything already pointing at it. */
export function setCityStatus(id: string, isActive: boolean) {
  return prisma.city.update({
    where: { id },
    data: { isActive },
    include: { state: { select: { name: true } } },
  });
}
