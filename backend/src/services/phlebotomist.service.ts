import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import * as phlebotomistRepository from "../repositories/phlebotomist.repository";
import * as organizationRepository from "../repositories/organization.repository";
import {
  toPhlebotomistDto,
  type PhlebotomistWriteInput,
} from "../repositories/phlebotomist.repository";
import type {
  ListPhlebotomistsParams,
  ListPhlebotomistsResult,
  PhlebotomistDto,
  PhlebotomistStatsDto,
} from "../types/phlebotomist.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Phlebotomist not found");
    }
    throw error;
  }
}

export async function listPhlebotomists(
  params: ListPhlebotomistsParams,
): Promise<ListPhlebotomistsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await phlebotomistRepository.listPhlebotomists({
    search: params.search,
    isActive: params.isActive,
    cityId: params.cityId,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toPhlebotomistDto), total };
}

/** Basic active-phlebotomist list for the Order Management assignment
 *  dropdown — no pagination, this round has no full phlebo module yet. */
export async function listActivePhlebotomists(): Promise<PhlebotomistDto[]> {
  const rows = await phlebotomistRepository.listActivePhlebotomists();
  return rows.map(toPhlebotomistDto);
}

export async function getPhlebotomist(id: string): Promise<PhlebotomistDto> {
  const phlebotomist = await phlebotomistRepository.findPhlebotomistById(id);
  if (!phlebotomist) {
    throw ApiError.notFound("Phlebotomist not found");
  }
  return toPhlebotomistDto(phlebotomist);
}

const IN_PROGRESS_STATUSES = [
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
];
const PENDING_STATUSES = ["PENDING", "CONFIRMED"];

/** The Phlebotomist Profile page's stats block — order counts/COD totals
 *  derived live from `AppOrder.phleboId` (always current, never drifts out
 *  of sync with the orders themselves) rather than a separately-tracked
 *  figure. Deliberately does NOT include ratings, payouts, or attendance —
 *  none of those are tracked anywhere in the schema yet (see
 *  `Phlebotomist`'s own doc-comment); a future module would add its own
 *  tables and its own stats function rather than fake numbers here. */
export async function getPhlebotomistStats(id: string): Promise<PhlebotomistStatsDto> {
  await getPhlebotomist(id); // 404s if this phlebotomist doesn't exist

  const [groups, codTotal, dateRange] = await Promise.all([
    prisma.appOrder.groupBy({
      by: ["status"],
      where: { phleboId: id, isDraft: false },
      _count: true,
    }),
    prisma.appOrder.aggregate({
      where: { phleboId: id, isDraft: false, paymentMode: "CASH", codCollectedAt: { not: null } },
      _sum: { totalPayable: true },
    }),
    prisma.appOrder.aggregate({
      where: { phleboId: id, isDraft: false },
      _min: { orderDate: true },
      _max: { orderDate: true },
    }),
  ]);

  const countOf = (...statuses: string[]) =>
    groups.filter((g) => statuses.includes(g.status)).reduce((sum, g) => sum + g._count, 0);

  const totalOrders = groups.reduce((sum, g) => sum + g._count, 0);
  const completedOrders = countOf("COMPLETED");

  return {
    totalOrders,
    completedOrders,
    cancelledOrders: countOf("CANCELLED"),
    rejectedOrders: countOf("REJECTED"),
    inProgressOrders: countOf(...IN_PROGRESS_STATUSES),
    pendingOrders: countOf(...PENDING_STATUSES),
    completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
    codCollectedTotal: Number(codTotal._sum.totalPayable ?? 0),
    firstOrderDate: dateRange._min.orderDate?.toISOString().slice(0, 10) ?? null,
    lastOrderDate: dateRange._max.orderDate?.toISOString().slice(0, 10) ?? null,
  };
}

export async function createPhlebotomist(values: PhlebotomistWriteInput): Promise<PhlebotomistDto> {
  const phlebotomist = await phlebotomistRepository.createPhlebotomist(values);
  return toPhlebotomistDto(phlebotomist);
}

export async function updatePhlebotomist(
  id: string,
  values: PhlebotomistWriteInput,
): Promise<PhlebotomistDto> {
  const phlebotomist = await withTranslatedErrors(() =>
    phlebotomistRepository.updatePhlebotomist(id, values),
  );
  return toPhlebotomistDto(phlebotomist);
}

export async function setPhlebotomistStatus(
  id: string,
  isActive: boolean,
): Promise<PhlebotomistDto> {
  await withTranslatedErrors(() => phlebotomistRepository.setPhlebotomistStatus(id, isActive));
  return getPhlebotomist(id);
}

export async function deletePhlebotomist(id: string): Promise<void> {
  await withTranslatedErrors(() => phlebotomistRepository.deletePhlebotomist(id));
}

// ---------------------------------------------------------------------------
// Franchise portal — a franchise's own phlebotomists only (never admin-
// created ones), scoped to the areas it's itself assigned to cover.
// ---------------------------------------------------------------------------

/** A franchise's own "Phlebotomists" screen — only the ones THEY created,
 *  never an admin-created phlebo or another franchise's. Same list also
 *  backs their Order Management's assign-phlebo picker. */
export async function listOwnPhlebotomists(organizationId: string): Promise<PhlebotomistDto[]> {
  const rows = await phlebotomistRepository.listActivePhlebotomists(organizationId);
  return rows.map(toPhlebotomistDto);
}

export interface CreateOwnPhlebotomistInput {
  name: string;
  mobile: string;
  photoUrl?: string | null;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  serviceAreaIds: string[];
}

/** Lets a franchise create its own phlebo, restricted to areas IT is itself
 *  assigned to cover (`OrganizationServiceArea`) — a franchise with every
 *  area of a city assigned can effectively place a phlebo anywhere in that
 *  city; one assigned only specific areas is restricted to exactly those,
 *  since both cases are just different sizes of the same assigned-area set.
 *  The phlebo's own `cityId` is derived from the chosen areas (which must
 *  all share one city) rather than taken as separate input, so the two can
 *  never disagree. */
export async function createOwnPhlebotomist(
  organizationId: string,
  input: CreateOwnPhlebotomistInput,
): Promise<PhlebotomistDto> {
  if (input.serviceAreaIds.length === 0) {
    throw ApiError.badRequest("Select at least one service area for this phlebotomist");
  }

  const ownAreas = await organizationRepository.listServiceAreas(organizationId);
  const ownAreaIds = new Set(ownAreas.map((a) => a.areaId));
  const notOwned = input.serviceAreaIds.filter((id) => !ownAreaIds.has(id));
  if (notOwned.length > 0) {
    throw ApiError.badRequest(
      "You can only assign a phlebotomist to areas your franchise is assigned to cover",
    );
  }

  const cityIds = new Set(
    ownAreas.filter((a) => input.serviceAreaIds.includes(a.areaId)).map((a) => a.area.cityId),
  );
  if (cityIds.size > 1) {
    throw ApiError.badRequest("Select service areas from a single city for this phlebotomist");
  }

  const phlebotomist = await phlebotomistRepository.createPhlebotomist({
    name: input.name,
    mobile: input.mobile,
    photoUrl: input.photoUrl,
    cityId: [...cityIds][0] ?? null,
    workingHoursStart: input.workingHoursStart,
    workingHoursEnd: input.workingHoursEnd,
    serviceAreaIds: input.serviceAreaIds,
    createdByOrganizationId: organizationId,
  });
  return toPhlebotomistDto(phlebotomist);
}

/** Ownership-checked status toggle — a franchise can only deactivate/
 *  reactivate a phlebo it created itself. */
export async function setOwnPhlebotomistStatus(
  organizationId: string,
  id: string,
  isActive: boolean,
): Promise<PhlebotomistDto> {
  const existing = await phlebotomistRepository.findPhlebotomistById(id);
  if (!existing || existing.createdByOrganizationId !== organizationId) {
    throw ApiError.notFound("Phlebotomist not found");
  }
  return setPhlebotomistStatus(id, isActive);
}
