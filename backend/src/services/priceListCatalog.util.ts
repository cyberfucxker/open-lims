import type { PriceListItemType } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";

/** Shared "every priceable catalogue item, with its catalogue price" reader
 *  plus the DTO/validation helpers that turn a row + an optional override
 *  into a priceable line — used by BOTH the franchise self-service price
 *  list (`franchise.service.ts`, one franchise's own clone) and the admin
 *  full-catalogue price editor (`priceList.service.ts`, any price list by
 *  id). One implementation so the two surfaces can't drift on what counts as
 *  "priceable" or how the effective price is derived. */

export interface PriceableCatalogRow {
  id: string;
  name: string;
  price: unknown;
  offerPrice: unknown;
  /** Set on a Test that is really a single Parameter made bookable — see
   *  `Test.sourceParameterId`. Only selected for TEST rows. */
  sourceParameterId?: string | null;
}

export interface PriceListOverride {
  price: number;
  /** False = explicitly excluded from this price list's catalogue (see
   *  `PriceListItem.isOffered`'s doc-comment) — absence of an override at all
   *  means the same as `isOffered: true`. */
  isOffered: boolean;
}

export interface PriceListLineDto {
  itemType: PriceListItemType;
  itemId: string;
  name: string;
  /** Catalogue selling price — what applies with no override. */
  catalogPrice: number;
  /** The price list's override for this item, or null when unset. */
  overridePrice: number | null;
  effectivePrice: number;
  /** Whether this item is offered under this price list — see
   *  `PriceListOverride.isOffered`. Defaults to `true` absent a row. */
  isOffered: boolean;
  /** True for a PARAMETER row, and for a TEST row that is a parameter's
   *  auto-provisioned shadow Test. Display-only: editors list these under
   *  "Parameters", but a shadow Test is still priced and saved as `TEST`
   *  because that is the row the booking pipeline resolves prices for. */
  isParameter: boolean;
}

/** Every active, non-deleted Test/Package/Parameter a price list may price.
 *  Parameters are further scoped to `doTest` — only independently-bookable
 *  analytes are sellable, so only those are priceable.
 *
 *  A bookable Parameter that already has a "shadow" Test (see
 *  `Test.sourceParameterId`'s doc-comment) is priced through THAT Test entry
 *  instead of its own `PARAMETER` row — that's the row `catalog.service.ts`'s
 *  `loadCityOverrides(priceListId, "TEST")` actually reads at checkout time,
 *  keyed by the shadow Test's id, not the Parameter's. Listing both would let
 *  an admin price the `PARAMETER` row and see it silently do nothing to what
 *  a patient is charged. The rare bookable Parameter with NO shadow Test yet
 *  (missing a Sample Type — see `ensureShadowTestForParameter`) still lists
 *  under `PARAMETER` since there's no Test entry to price it through. */
export async function loadPriceableCatalog(): Promise<
  Record<PriceListItemType, PriceableCatalogRow[]>
> {
  const [tests, packages, parameters] = await Promise.all([
    prisma.test.findMany({
      where: { status: "Active" },
      select: { id: true, name: true, price: true, offerPrice: true, sourceParameterId: true },
      orderBy: { name: "asc" },
    }),
    prisma.package.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true, name: true, price: true, offerPrice: true },
      orderBy: { name: "asc" },
    }),
    prisma.parameter.findMany({
      where: { active: true, doTest: true, shadowTest: { is: null } },
      select: { id: true, name: true, price: true, offerPrice: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { TEST: tests, PACKAGE: packages, PARAMETER: parameters };
}

export function toItemDto(
  itemType: PriceListItemType,
  row: PriceableCatalogRow,
  override: PriceListOverride | undefined,
): PriceListLineDto {
  const base = Number(row.price);
  const catalogPrice = row.offerPrice != null ? Number(row.offerPrice) : base;
  return {
    itemType,
    itemId: row.id,
    name: row.name,
    catalogPrice,
    overridePrice: override?.price ?? null,
    effectivePrice: override?.price ?? catalogPrice,
    isOffered: override?.isOffered ?? true,
    isParameter: itemType === "PARAMETER" || row.sourceParameterId != null,
  };
}

/** Rejects overrides pointing at catalogue rows that do not exist. Without a
 *  foreign key on the polymorphic `itemId`, nothing else would catch it and
 *  the row would sit in the list forever, invisible. */
export async function assertItemsExist(
  items: { itemType: PriceListItemType; itemId: string }[],
): Promise<void> {
  if (items.length === 0) return;

  const ids = {
    TEST: items.filter((i) => i.itemType === "TEST").map((i) => i.itemId),
    PACKAGE: items.filter((i) => i.itemType === "PACKAGE").map((i) => i.itemId),
    PARAMETER: items.filter((i) => i.itemType === "PARAMETER").map((i) => i.itemId),
  };

  const [tests, packages, parameters] = await Promise.all([
    ids.TEST.length
      ? prisma.test.findMany({ where: { id: { in: ids.TEST } }, select: { id: true } })
      : Promise.resolve([]),
    ids.PACKAGE.length
      ? prisma.package.findMany({ where: { id: { in: ids.PACKAGE } }, select: { id: true } })
      : Promise.resolve([]),
    ids.PARAMETER.length
      ? prisma.parameter.findMany({ where: { id: { in: ids.PARAMETER } }, select: { id: true } })
      : Promise.resolve([]),
  ]);

  const found = new Set([
    ...tests.map((t) => `TEST:${t.id}`),
    ...packages.map((p) => `PACKAGE:${p.id}`),
    ...parameters.map((p) => `PARAMETER:${p.id}`),
  ]);
  const missing = items.filter((i) => !found.has(`${i.itemType}:${i.itemId}`));
  if (missing.length > 0) {
    throw ApiError.badRequest("One or more priced items no longer exist in the catalogue", {
      missing: missing.map((i) => `${i.itemType}:${i.itemId}`),
    });
  }
}
