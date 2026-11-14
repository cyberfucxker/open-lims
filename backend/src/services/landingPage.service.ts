import type { LandingPage, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slug.util";
import { listPackages, type PackageCatalogItem } from "./app/catalog.service";

/**
 * Ad landing pages — `/offer/<slug>` on the website. Superadmin sets the
 * name, slug, title, city, packages, the two banner images and the validity
 * window; everything else on the page is a fixed design.
 */

export type LandingPageState = "LIVE" | "UPCOMING" | "EXPIRED" | "OFF";

export function landingPageState(
  page: Pick<LandingPage, "isActive" | "validFrom" | "validTo">,
  now = new Date(),
): LandingPageState {
  if (!page.isActive) return "OFF";
  if (now < page.validFrom) return "UPCOMING";
  if (now > page.validTo) return "EXPIRED";
  return "LIVE";
}

const ADMIN_INCLUDE = {
  city: { select: { id: true, name: true, slug: true } },
  packages: {
    orderBy: { sortOrder: "asc" },
    include: { package: { select: { id: true, name: true, active: true, deletedAt: true } } },
  },
} satisfies Prisma.LandingPageInclude;

type AdminRow = Prisma.LandingPageGetPayload<{ include: typeof ADMIN_INCLUDE }>;

function toAdmin(row: AdminRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    title: row.title,
    city: row.city,
    desktopBannerUrl: row.desktopBannerUrl,
    mobileBannerUrl: row.mobileBannerUrl,
    validFrom: row.validFrom,
    validTo: row.validTo,
    isActive: row.isActive,
    state: landingPageState(row),
    packages: row.packages.map((p) => ({
      id: p.package.id,
      name: p.package.name,
      available: p.package.active && !p.package.deletedAt,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listLandingPages() {
  const rows = await prisma.landingPage.findMany({
    include: ADMIN_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toAdmin);
}

export async function getLandingPage(id: string) {
  const row = await prisma.landingPage.findUnique({ where: { id }, include: ADMIN_INCLUDE });
  if (!row) throw ApiError.notFound("Landing page not found");
  return toAdmin(row);
}

export interface LandingPageInput {
  name: string;
  slug?: string;
  title: string;
  cityId: string;
  packageIds: string[];
  desktopBannerUrl?: string | null;
  mobileBannerUrl?: string | null;
  validFrom: string;
  validTo: string;
  isActive?: boolean;
}

async function validate(input: LandingPageInput, excludeId?: string) {
  const slug = slugify(input.slug?.trim() || input.name);
  if (!slug) throw ApiError.badRequest("Enter a slug (letters and numbers)");
  const clash = await prisma.landingPage.findFirst({
    where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (clash) throw ApiError.conflict(`The slug "${slug}" is already used by another landing page`);

  const city = await prisma.city.findUnique({ where: { id: input.cityId }, select: { id: true } });
  if (!city) throw ApiError.badRequest("Select a valid city");

  const packageIds = [...new Set(input.packageIds)];
  if (packageIds.length === 0) throw ApiError.badRequest("Add at least one package");
  const found = await prisma.package.count({
    where: { id: { in: packageIds }, active: true, deletedAt: null },
  });
  if (found !== packageIds.length) {
    throw ApiError.badRequest("One or more selected packages are inactive or deleted");
  }

  const validFrom = new Date(input.validFrom);
  const validTo = new Date(input.validTo);
  if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validTo.getTime())) {
    throw ApiError.badRequest("Enter valid start and end dates");
  }
  if (validTo <= validFrom) throw ApiError.badRequest("The end date must be after the start date");

  return { slug, packageIds, validFrom, validTo };
}

export async function createLandingPage(input: LandingPageInput) {
  const { slug, packageIds, validFrom, validTo } = await validate(input);
  const row = await prisma.landingPage.create({
    data: {
      name: input.name.trim(),
      slug,
      title: input.title.trim(),
      cityId: input.cityId,
      desktopBannerUrl: input.desktopBannerUrl || null,
      mobileBannerUrl: input.mobileBannerUrl || null,
      validFrom,
      validTo,
      isActive: input.isActive ?? true,
      packages: { create: packageIds.map((packageId, sortOrder) => ({ packageId, sortOrder })) },
    },
    include: ADMIN_INCLUDE,
  });
  return toAdmin(row);
}

export async function updateLandingPage(id: string, input: LandingPageInput) {
  await getLandingPage(id);
  const { slug, packageIds, validFrom, validTo } = await validate(input, id);
  const row = await prisma.$transaction(async (tx) => {
    await tx.landingPagePackage.deleteMany({ where: { landingPageId: id } });
    return tx.landingPage.update({
      where: { id },
      data: {
        name: input.name.trim(),
        slug,
        title: input.title.trim(),
        cityId: input.cityId,
        desktopBannerUrl: input.desktopBannerUrl || null,
        mobileBannerUrl: input.mobileBannerUrl || null,
        validFrom,
        validTo,
        isActive: input.isActive ?? true,
        packages: { create: packageIds.map((packageId, sortOrder) => ({ packageId, sortOrder })) },
      },
      include: ADMIN_INCLUDE,
    });
  });
  return toAdmin(row);
}

export async function setLandingPageStatus(id: string, isActive: boolean) {
  await getLandingPage(id);
  const row = await prisma.landingPage.update({
    where: { id },
    data: { isActive },
    include: ADMIN_INCLUDE,
  });
  return toAdmin(row);
}

export async function deleteLandingPage(id: string) {
  await getLandingPage(id);
  await prisma.landingPage.delete({ where: { id } });
}

// ─── Public (website) ──────────────────────────────────────────────────────

export interface PublicLandingPage {
  slug: string;
  state: LandingPageState;
  title: string;
  city: { id: string; name: string; slug: string; is_active: boolean };
  desktop_banner_url: string | null;
  mobile_banner_url: string | null;
  valid_to: string;
  /** Empty unless the page is LIVE. Same objects (and so the same prices)
   *  as the website's package catalogue for this city. */
  packages: PackageCatalogItem[];
}

export async function getPublicLandingPage(
  slug: string,
  appUserId: string | null,
): Promise<PublicLandingPage> {
  const page = await prisma.landingPage.findUnique({
    where: { slug },
    include: {
      city: true,
      packages: { orderBy: { sortOrder: "asc" }, select: { packageId: true } },
    },
  });
  if (!page) throw ApiError.notFound("Offer not found");

  const state = landingPageState(page);
  let packages: PackageCatalogItem[] = [];
  if (state === "LIVE") {
    // The catalogue's own listing for this city — prices, offer prices and
    // "already in cart" exactly as the rest of the website shows them.
    const catalogue = await listPackages(appUserId, page.cityId, null, { page: 1, pageSize: 1000 });
    const byId = new Map(catalogue.items.map((p) => [p.id, p]));
    packages = page.packages
      .map((p) => byId.get(p.packageId))
      .filter((p): p is PackageCatalogItem => !!p);
  }

  return {
    slug: page.slug,
    state,
    title: page.title,
    city: {
      id: page.city.id,
      name: page.city.name,
      slug: page.city.slug,
      is_active: page.city.isActive,
    },
    desktop_banner_url: page.desktopBannerUrl,
    mobile_banner_url: page.mobileBannerUrl,
    valid_to: page.validTo.toISOString(),
    packages,
  };
}
