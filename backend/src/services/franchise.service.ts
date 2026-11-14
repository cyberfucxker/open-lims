import type { PriceListItemType } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import * as organizationRepository from "../repositories/organization.repository";
import { assertItemsExist, loadPriceableCatalog, toItemDto } from "./priceListCatalog.util";
import type {
  FranchisePriceListDto,
  FranchisePriceListItemWrite,
  FranchiseProfileDto,
  FranchiseProfileWriteData,
} from "../types/franchise.types";
import type { FranchiseType } from "../types/organization.types";

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getProfile(organizationId: string): Promise<FranchiseProfileDto> {
  const organization = await organizationRepository.findOrganizationById(organizationId);
  if (!organization) {
    throw ApiError.notFound("Franchise not found");
  }

  return {
    id: organization.id,
    code: organization.code,
    name: organization.name,
    // `contactPerson` is the Owner Name — see the column's doc-comment.
    ownerName: organization.contactPerson,
    mobile: organization.mobile,
    email: organization.email,
    cityName: organization.cityRef?.name ?? organization.city,
    franchiseType: organization.franchiseType as FranchiseType,
    labName: organization.labName,
    labLogoPath: organization.labLogoPath,
    priceListName: organization.priceList?.name ?? null,
    username: organization.users[0]?.username ?? null,
    commissionPct: Number(organization.commissionPct),
    createdAt: organization.createdAt.toISOString(),
  };
}

export async function updateProfile(
  organizationId: string,
  values: FranchiseProfileWriteData,
): Promise<FranchiseProfileDto> {
  const organization = await organizationRepository.findOrganizationById(organizationId);
  if (!organization) {
    throw ApiError.notFound("Franchise not found");
  }

  // A Single Lab franchise renders the global (global) branding, so letting it
  // set a lab name would store a value that never appears anywhere — confusing
  // rather than harmful, but worth rejecting outright.
  if (values.labName !== undefined && organization.franchiseType !== "CO_LAB") {
    throw ApiError.badRequest("Only a Co-Lab franchise can set its own lab name");
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      contactPerson: values.ownerName,
      mobile: values.mobile,
      email: values.email,
      ...(values.labName !== undefined ? { labName: values.labName } : {}),
    },
  });

  await organizationRepository.createAuditLog(organizationId, "PROFILE_UPDATED", null);
  return getProfile(organizationId);
}

export async function saveLabLogo(
  organizationId: string,
  logoPath: string,
): Promise<FranchiseProfileDto> {
  const organization = await organizationRepository.findOrganizationById(organizationId);
  if (!organization) {
    throw ApiError.notFound("Franchise not found");
  }
  if (organization.franchiseType !== "CO_LAB") {
    throw ApiError.badRequest("Only a Co-Lab franchise can set its own lab logo");
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { labLogoPath: logoPath },
  });
  await organizationRepository.createAuditLog(organizationId, "LAB_LOGO_UPDATED", null);
  return getProfile(organizationId);
}

// ---------------------------------------------------------------------------
// Price list
// ---------------------------------------------------------------------------
//
// `loadPriceableCatalog`/`toItemDto`/`assertItemsExist` live in
// `priceListCatalog.util.ts` now — shared with the admin full-catalogue price
// editor (`priceList.service.ts`), which needs the exact same "what's
// priceable, what's its catalogue price" logic for a price list by id rather
// than by owning franchise.

/**
 * The franchise's own price list, one row per priceable catalogue item.
 *
 * Resolved by owner, never by an id from the request — a franchise cannot name
 * a list to read. That is the entire cross-franchise isolation story on the
 * read side.
 */
export async function getOwnPriceList(organizationId: string): Promise<FranchisePriceListDto> {
  const priceList = await organizationRepository.findOwnedPriceList(organizationId);
  if (!priceList) {
    throw ApiError.notFound(
      "No price list has been assigned to your franchise yet. Contact the lab administrator.",
    );
  }

  const catalog = await loadPriceableCatalog();
  const overrides = new Map(
    priceList.items.map((item) => [
      `${item.itemType}:${item.itemId}`,
      { price: Number(item.price), isOffered: item.isOffered },
    ]),
  );

  const build = (itemType: PriceListItemType) =>
    catalog[itemType].map((row) =>
      toItemDto(itemType, row, overrides.get(`${itemType}:${row.id}`)),
    );

  return {
    id: priceList.id,
    name: priceList.name,
    itemsByType: {
      TEST: build("TEST"),
      PACKAGE: build("PACKAGE"),
      PARAMETER: build("PARAMETER"),
    },
  };
}

/**
 * Replaces the franchise's overrides.
 *
 * The list id is re-resolved from the caller's organization and the incoming
 * `priceListId` is never trusted — this is the single most important check in
 * the module, and the reason a franchise cannot write another's prices even
 * with a hand-crafted request.
 */
export async function setOwnPriceListItems(
  organizationId: string,
  items: FranchisePriceListItemWrite[],
): Promise<FranchisePriceListDto> {
  const priceList = await organizationRepository.findOwnedPriceList(organizationId);
  if (!priceList) {
    throw ApiError.notFound("No price list has been assigned to your franchise yet.");
  }
  if (priceList.ownerOrganizationId !== organizationId) {
    // Unreachable through `findOwnedPriceList`, which filters by owner. Kept as
    // a belt-and-braces assertion because the cost of this invariant silently
    // breaking is one franchise editing another's prices.
    throw ApiError.forbidden("You do not have permission to edit this price list");
  }

  await assertItemsExist(items);
  await organizationRepository.replaceOwnedPriceListItems(priceList.id, items);
  await organizationRepository.createAuditLog(organizationId, "PRICES_UPDATED", null);

  return getOwnPriceList(organizationId);
}

// ---------------------------------------------------------------------------
// Service areas
// ---------------------------------------------------------------------------

/** Which Area(s) this franchise is assigned to cover — read-only from the
 *  franchise's side; an admin assigns these from Superadmin. This is what a
 *  patient-web/app order (which never names a franchise) actually resolves to
 *  — see `franchiseOrderScope.ts`. */
export async function getServiceAreas(organizationId: string) {
  const rows = await organizationRepository.listServiceAreas(organizationId);
  return rows.map((row) => ({
    id: row.area.id,
    name: row.area.name,
    cityId: row.area.cityId,
    cityName: row.area.city.name,
    // Lets Create Order's new-customer address fill its `state` field
    // without asking the franchise to type it — the area already implies it.
    stateName: row.area.city.state.name,
  }));
}
