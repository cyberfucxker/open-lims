import type { PriceList, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type {
  PriceListDto,
  PriceListItemWriteData,
  PriceListItemsViewWriteData,
} from "../types/priceList.types";

export interface ListPriceListsFilter {
  search?: string;
  active?: string;
  /** "template" = admin-authored, assignable lists (owner NULL).
   *  "franchise" = private clones owned by one franchise.
   *  Omitted returns both, which is what the LIMS price-list screen wants. */
  ownership?: "template" | "franchise";
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: string;
  skip: number;
  take: number;
}

export interface PriceListWriteInput {
  name: string;
  description?: string | null;
  active?: boolean;
}

const SORTABLE_FIELDS = new Set(["name", "active", "createdAt", "updatedAt"]);

export function toPriceListDto(priceList: PriceList): PriceListDto {
  return {
    id: priceList.id,
    name: priceList.name,
    description: priceList.description,
    active: priceList.active,
    deletedAt: priceList.deletedAt ? priceList.deletedAt.toISOString() : null,
    createdAt: priceList.createdAt.toISOString(),
    updatedAt: priceList.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListPriceListsFilter, "search" | "active" | "includeDeleted" | "ownership">,
): Prisma.PriceListWhereInput {
  const where: Prisma.PriceListWhereInput = {};

  // Assignment dropdowns must offer templates ONLY — assigning a franchise's
  // private clone to a second franchise is exactly what clone-on-assign exists
  // to prevent, and the service rejects it, so offering it is a dead end.
  if (filter.ownership === "template") {
    where.ownerOrganizationId = null;
  } else if (filter.ownership === "franchise") {
    where.ownerOrganizationId = { not: null };
  }

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

function buildOrderBy(sortBy?: string, sortDir?: string): Prisma.PriceListOrderByWithRelationInput {
  const field = sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  return { [field]: sortDir === "asc" ? "asc" : "desc" };
}

export async function listPriceLists(
  filter: ListPriceListsFilter,
): Promise<{ rows: PriceList[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.priceList.findMany({
      where,
      orderBy: buildOrderBy(filter.sortBy, filter.sortDir),
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.priceList.count({ where }),
  ]);

  return { rows, total };
}

export function findPriceListById(id: string) {
  return prisma.priceList.findFirst({ where: { id, deletedAt: null } });
}

export function createPriceList(data: PriceListWriteInput) {
  return prisma.priceList.create({ data: { ...data, active: data.active ?? true } });
}

export function updatePriceList(id: string, data: PriceListWriteInput) {
  return prisma.priceList.update({ where: { id }, data });
}

export function softDeletePriceList(id: string) {
  return prisma.priceList.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export function restorePriceList(id: string) {
  return prisma.priceList.update({ where: { id }, data: { deletedAt: null } });
}

export function setPriceListStatus(id: string, active: boolean) {
  return prisma.priceList.update({ where: { id }, data: { active } });
}

/** Every active, non-deleted Test with its catalogue price and any override
 *  this price list already has, so the editor can render one row per test.
 *
 *  `price_list_items` is polymorphic over Test/Package/Parameter, but this
 *  function — and the `/price-lists/:id/items` contract it backs — is still
 *  Test-only, so it filters to `TEST` rows. Packages and Parameters are read
 *  and written through the franchise pricing layer instead. */
export async function listItemsForPriceList(priceListId: string) {
  const [tests, overrides] = await Promise.all([
    prisma.test.findMany({
      where: { status: "Active" },
      include: { department: true, appCategory: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.priceListItem.findMany({ where: { priceListId, itemType: "TEST" } }),
  ]);

  const overrideByTestId = new Map(overrides.map((item) => [item.itemId, item]));

  return tests.map((test) => ({
    testId: test.id,
    testName: test.name,
    // Same fallback as the report grouping — see `report.repository.ts`.
    departmentName: test.department?.name ?? test.appCategory?.name ?? "General",
    catalogPrice: Number(test.price),
    overridePrice: overrideByTestId.has(test.id)
      ? Number(overrideByTestId.get(test.id)!.price)
      : null,
  }));
}

/** Replaces the full override set for a price list in one transaction —
 *  simpler and safer than diffing add/update/remove client-side.
 *
 *  Scoped to `TEST` rows on both sides of the replace: this endpoint only ever
 *  sends tests, so deleting the price list's Package/Parameter overrides here
 *  would silently wipe pricing this caller cannot even see. */
export function replacePriceListItems(priceListId: string, items: PriceListItemWriteData[]) {
  return prisma.$transaction([
    prisma.priceListItem.deleteMany({ where: { priceListId, itemType: "TEST" } }),
    ...(items.length > 0
      ? [
          prisma.priceListItem.createMany({
            data: items.map((item) => ({
              priceListId,
              itemType: "TEST" as const,
              itemId: item.testId,
              price: item.price,
            })),
          }),
        ]
      : []),
  ]);
}

/** Every override this price list has, across all three item types — the read
 *  side of the admin full-catalogue price editor. Unlike `listItemsForPriceList`
 *  above (TEST-only, backs the older test-only sheet), this is deliberately
 *  type-agnostic; `priceList.service.ts#getPriceListItemsView` pairs each row
 *  against `loadPriceableCatalog()` to build the full TEST+PACKAGE+PARAMETER
 *  view. */
export async function listAllItemsForPriceList(priceListId: string) {
  return prisma.priceListItem.findMany({ where: { priceListId } });
}

/** Replaces the FULL override set (all three item types) for a price list in
 *  one transaction — same delete-then-recreate approach as
 *  `replacePriceListItems`, just not scoped to `TEST`. The caller
 *  (`priceList.service.ts#setPriceListItemsView`) always sends the complete
 *  set, same convention as the franchise self-service editor. */
export function replaceAllItemsForPriceList(
  priceListId: string,
  items: PriceListItemsViewWriteData[],
) {
  return prisma.$transaction([
    prisma.priceListItem.deleteMany({ where: { priceListId } }),
    ...(items.length > 0
      ? [
          prisma.priceListItem.createMany({
            data: items.map((item) => ({
              priceListId,
              itemType: item.itemType,
              itemId: item.itemId,
              price: item.price,
              isOffered: item.isOffered,
            })),
          }),
        ]
      : []),
  ]);
}
