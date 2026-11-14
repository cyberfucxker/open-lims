import type { PriceListItemType } from "@prisma/client";
import { prisma } from "../config/database";

/**
 * Resolves effective prices for catalogue items under a given price list.
 *
 * Before this existed, `PriceListItem` rows were written and read by the price
 * list editor but consulted by NOTHING — billing (`appointment.service.ts`) and
 * the patient-app catalogue both read `Test.price`/`offerPrice` directly, so a
 * price list had no effect on any number a customer ever saw. This is the layer
 * that makes them real.
 *
 * Scope is deliberately narrow (see the plan's D5): only franchise-facing reads
 * and franchise-created orders pass a `priceListId`. Admin billing, LIMS and the
 * B2C app all pass null and get exactly today's behaviour, which is what keeps
 * the change non-breaking.
 */

export interface CatalogItemRef {
  itemType: PriceListItemType;
  itemId: string;
}

export interface ResolvedPrice {
  /** The catalogue's own price — MRP for Test/Parameter, flat price for Package. */
  basePrice: number;
  /** What the catalogue actually sells at absent any price list: `offerPrice`
   *  when set, otherwise `basePrice`. This, not `basePrice`, is what an override
   *  replaces. */
  catalogPrice: number;
  /** `catalogPrice`, or the price list's override when one exists. */
  effectivePrice: number;
  isOverridden: boolean;
  name: string;
}

export type PriceMap = Map<string, ResolvedPrice>;

/** Composite key for the polymorphic (type, id) pair. */
export function priceKey(itemType: PriceListItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

async function loadCatalogPrices(refs: CatalogItemRef[]) {
  const byType = {
    TEST: refs.filter((r) => r.itemType === "TEST").map((r) => r.itemId),
    PACKAGE: refs.filter((r) => r.itemType === "PACKAGE").map((r) => r.itemId),
    PARAMETER: refs.filter((r) => r.itemType === "PARAMETER").map((r) => r.itemId),
  };

  const [tests, packages, parameters] = await Promise.all([
    byType.TEST.length
      ? prisma.test.findMany({
          where: { id: { in: byType.TEST } },
          select: { id: true, name: true, price: true, offerPrice: true },
        })
      : Promise.resolve([]),
    byType.PACKAGE.length
      ? prisma.package.findMany({
          where: { id: { in: byType.PACKAGE } },
          select: { id: true, name: true, price: true, offerPrice: true },
        })
      : Promise.resolve([]),
    byType.PARAMETER.length
      ? prisma.parameter.findMany({
          where: { id: { in: byType.PARAMETER } },
          select: { id: true, name: true, price: true, offerPrice: true },
        })
      : Promise.resolve([]),
  ]);

  const catalog = new Map<string, { name: string; basePrice: number; catalogPrice: number }>();
  const add = (
    itemType: PriceListItemType,
    rows: { id: string; name: string; price: unknown; offerPrice: unknown }[],
  ) => {
    for (const row of rows) {
      const basePrice = Number(row.price);
      catalog.set(priceKey(itemType, row.id), {
        name: row.name,
        basePrice,
        catalogPrice: row.offerPrice != null ? Number(row.offerPrice) : basePrice,
      });
    }
  };

  add("TEST", tests);
  add("PACKAGE", packages);
  add("PARAMETER", parameters);
  return catalog;
}

/**
 * Effective price per requested item. Items that do not exist in the catalogue
 * are simply absent from the returned map — callers decide whether that is an
 * error (order creation) or a row to skip (catalogue listing).
 */
export async function resolvePrices(
  priceListId: string | null,
  refs: CatalogItemRef[],
): Promise<PriceMap> {
  const result: PriceMap = new Map();
  if (refs.length === 0) return result;

  const [catalog, overrides] = await Promise.all([
    loadCatalogPrices(refs),
    priceListId
      ? prisma.priceListItem.findMany({
          where: { priceListId, OR: refs.map((r) => ({ itemType: r.itemType, itemId: r.itemId })) },
          select: { itemType: true, itemId: true, price: true },
        })
      : Promise.resolve([]),
  ]);

  const overrideByKey = new Map(
    overrides.map((o) => [priceKey(o.itemType, o.itemId), Number(o.price)]),
  );

  for (const ref of refs) {
    const key = priceKey(ref.itemType, ref.itemId);
    const entry = catalog.get(key);
    if (!entry) continue;

    const override = overrideByKey.get(key);
    result.set(key, {
      name: entry.name,
      basePrice: entry.basePrice,
      catalogPrice: entry.catalogPrice,
      effectivePrice: override ?? entry.catalogPrice,
      isOverridden: override !== undefined,
    });
  }

  return result;
}

/** Convenience for the common single-type case (e.g. resolving an order's tests). */
export async function resolveTestPrices(
  priceListId: string | null,
  testIds: string[],
): Promise<PriceMap> {
  return resolvePrices(
    priceListId,
    testIds.map((itemId) => ({ itemType: "TEST" as const, itemId })),
  );
}

/**
 * Which price list — if any — governs the patient-app catalogue for a city.
 *
 * A city can have several franchises (`Organization.cityId`), but only the
 * one city.parentOrganizationId points at is authoritative for what a
 * patient browsing that city sees: its `priceListId` (the list currently in
 * use, not necessarily its private clone — see `Organization.priceList`)
 * decides both which items are offered (`PriceListItem.isOffered`) and at
 * what price. No city selected, no parent set, or the parent has no price
 * list yet all resolve to `null` — callers (`catalog.service.ts`) treat that
 * as "show the full global catalogue," never as "show nothing."
 */
export async function resolveCityPriceListId(
  cityId: string | null | undefined,
): Promise<string | null> {
  if (!cityId) return null;

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { parentOrganization: { select: { priceListId: true } } },
  });

  return city?.parentOrganization?.priceListId ?? null;
}
