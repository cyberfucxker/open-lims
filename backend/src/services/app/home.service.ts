import { prisma } from "../../config/database";
import { resolveCityPriceListId } from "../pricing.service";
import {
  cartedItemIds,
  computePackageParameterCount,
  loadCityOverrides,
  testRankComparator,
} from "./catalog.service";

export interface HomeResult {
  app_banners: Array<{ id: string; image: string }>;
  /** The WEBSITE's hero carousel (Superadmin CMS > Web Banner). Separate from
   *  `app_banners`, which is the mobile app's image-only strip: these slides
   *  carry their own copy, and a slide that promotes a Package carries that
   *  package's LIVE, city-scoped price rather than a number someone typed —
   *  the hardcoded banner this replaced advertised a price the package card
   *  right below it contradicted. */
  /** HOME-placement banners: artwork only. The Home hero draws its own
   *  heading, search box and buttons over these, so nothing here is copy the
   *  admin has to write — see `WebBannerPlacement` in the schema. */
  home_banners: Array<{
    id: string;
    image: string;
    /** Where the artwork leads when tapped. Null = the slide is decoration. */
    link_url: string | null;
  }>;
  web_banners: Array<{
    id: string;
    badge: string | null;
    /** Always present on a CITY banner, which is all this list carries. */
    title: string;
    subtitle: string | null;
    image: string;
    /** Null on a pure promo slide — render it without a price block. */
    package: {
      id: string;
      slug: string;
      name: string;
      parameter_count: number;
      price: number;
      offer_price: number;
      discount_percent: number;
    } | null;
    /** Where to go when no package is attached. */
    link_url: string | null;
  }>;
  categories: Array<{ id: string; name: string; image: string | null; thumbnail: string | null }>;
  packages: Array<{
    id: string;
    slug: string;
    package_name: string;
    package_code: string;
    actual_price: number;
    offer_price: number;
    parameter_count: number;
    reporting_time: string;
    booked_count: number;
    is_added_to_cart: boolean;
    /** From the resolved city's price list, same rule as
     *  `catalog.service.ts#listPackages`'s own `isOffered` filter — false
     *  means this city's franchise doesn't sell it. Unlike the full
     *  catalogue list, Home doesn't drop the row for it (it's a small,
     *  admin-curated "Popular" set, not a paged browse list) — the app
     *  decides how to show a not-available-here item. Always true with no
     *  city selected, since there's no price list to check against. */
    is_available_in_city: boolean;
  }>;
  tests: Array<{
    id: string;
    slug: string;
    test_name: string;
    test_code: string;
    price: number;
    offer_price: number;
    parameter_count: number;
    reporting_time: string;
    booked_count: number;
    is_added_to_cart: boolean;
    /** See `packages[].is_available_in_city`'s doc-comment — same rule. */
    is_available_in_city: boolean;
    /** See `catalog.service.ts#TestCatalogItem.is_parameter` — same flag,
     *  same single purpose (which detail URL the card links to). */
    is_parameter: boolean;
  }>;
  coupons: Array<{
    id: string;
    coupon_code: string;
    title: string;
    discount_type: string;
    discount_value: number;
    min_booking_amount: number;
    applicable_on: string;
    valid_till: string | null;
  }>;
}

/** `appUserId` is `null` for a guest (browsing without a Bearer token) — every
 *  `is_added_to_cart` flag just comes back `false` in that case, same as any
 *  logged-in patient who hasn't carted anything yet.
 *
 *  `cityId` is the patient's selected city (same query param the catalogue
 *  list/detail routes take) — optional, since a guest may not have picked
 *  one yet. When given, `offer_price` and `is_available_in_city` reflect
 *  that city's resolved price list (`pricing.service.ts#resolveCityPriceListId`),
 *  exactly like `catalog.service.ts#listTests`/`listPackages` already do for
 *  the full catalogue — Home was the one surface still quoting the same
 *  global price to every city. The *set* of Popular Tests/Packages shown
 *  doesn't change by city, only their price/availability — this is a small,
 *  admin-curated list, not the paged browse catalogue that filters
 *  not-offered-here rows out entirely. */
export async function getHome(
  appUserId: string | null,
  cityId?: string | null,
): Promise<HomeResult> {
  const now = new Date();

  const [
    banners,
    categories,
    popularPackages,
    popularTests,
    cartedPackageIds,
    cartedTestIds,
    homeCoupons,
    priceListId,
    webBanners,
    homeBanners,
  ] = await Promise.all([
    prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gte: now } }] }],
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.appCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    // "Popular Packages" — admin-curated via Package.isPopular (Superadmin
    // CMS's Popular Packages tab), same field the Test/Package module and
    // GET /api/v1/app/catalog/packages already use for its "Popular" tag.
    // Ranked by the admin's curated sortOrder, same as the full catalogue
    // browse — see catalog.service.ts's listPackages.
    prisma.package.findMany({
      where: { active: true, deletedAt: null, isPopular: true },
      include: {
        packageTests: { include: { test: { include: { parameters: true } } } },
        packageParameters: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    // "Popular Tests" — admin-curated via Test.isPopular (Superadmin CMS's
    // Popular Tests tab), the same flag the Test form's own "Popular" switch
    // sets. Ranking (including the shadow-Test/source-Parameter rule) is
    // applied in JS below via `testRankComparator` — see its doc-comment.
    prisma.test.findMany({
      where: { status: "Active", isPopular: true },
      include: {
        _count: { select: { parameters: true } },
        sourceParameter: { select: { sortOrder: true } },
      },
    }),
    cartedItemIds(appUserId, "PACKAGE"),
    cartedItemIds(appUserId, "TEST"),
    // "Popular Coupons" — admin-curated via Coupon.showOnHome (CMS Coupons
    // tab's Home Coupons picker), ordered by Coupon.homeSortOrder.
    prisma.coupon.findMany({
      where: {
        isActive: true,
        showOnHome: true,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
      },
      orderBy: { homeSortOrder: "asc" },
    }),
    resolveCityPriceListId(cityId),
    // Hero slides plus each one's promoted package. `packageTests`/
    // `packageParameters` are pulled for the same reason the popular-package
    // cards below pull them: the count shown on a slide has to be computed
    // via the same `computePackageParameterCount` as the card sitting right
    // under it, or the page contradicts itself again.
    prisma.webBanner.findMany({
      where: { placement: "CITY", isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        package: {
          include: {
            packageTests: { include: { test: { include: { parameters: true } } } },
            packageParameters: true,
          },
        },
      },
    }),
    // Home's own masthead artwork. No package join: a Home banner never shows
    // a price block, so there is nothing to keep in step with the cards below.
    prisma.webBanner.findMany({
      where: { placement: "HOME", isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, imageUrl: true, linkUrl: true },
    }),
  ]);

  const [packageOverrides, testOverrides] = await Promise.all([
    loadCityOverrides(priceListId, "PACKAGE"),
    loadCityOverrides(priceListId, "TEST"),
  ]);

  // See testRankComparator's doc-comment — a shadow Test's rank borrows its
  // source Parameter's sortOrder, so this can't be a plain query `orderBy`.
  popularTests.sort(testRankComparator);

  return {
    app_banners: banners.map((b) => ({ id: b.id, image: b.imageUrl })),
    home_banners: homeBanners.map((b) => ({
      id: b.id,
      image: b.imageUrl,
      link_url: b.linkUrl,
    })),
    web_banners: webBanners.map((banner) => {
      const pkg = banner.package;
      // A soft-deleted or inactive package degrades the slide to a promo one
      // (no price block) rather than quoting a package nobody can buy.
      const sellable = pkg && pkg.active && !pkg.deletedAt ? pkg : null;
      const override = sellable ? packageOverrides.get(sellable.id) : undefined;

      if (!sellable) {
        return {
          id: banner.id,
          badge: banner.badge,
          title: banner.title ?? "",
          subtitle: banner.subtitle,
          image: banner.imageUrl,
          package: null,
          link_url: banner.linkUrl,
        };
      }

      const mrp = Number(sellable.price);
      const offerPrice = override ? override.price : Number(sellable.offerPrice ?? sellable.price);

      return {
        id: banner.id,
        badge: banner.badge,
        title: banner.title ?? "",
        subtitle: banner.subtitle,
        image: banner.imageUrl,
        package: {
          id: sellable.id,
          slug: sellable.slug,
          name: sellable.name,
          parameter_count: computePackageParameterCount(sellable),
          price: mrp,
          offer_price: offerPrice,
          // Rounded here rather than in the client so the website and the app
          // can't round the same discount two different ways.
          discount_percent: mrp > 0 ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0,
        },
        link_url: banner.linkUrl,
      };
    }),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      image: c.imageUrl,
      thumbnail: c.thumbnailUrl,
    })),
    packages: popularPackages.map((pkg) => {
      const override = packageOverrides.get(pkg.id);
      return {
        id: pkg.id,
        slug: pkg.slug,
        package_name: pkg.name,
        package_code: `PKG-${pkg.id.slice(0, 6).toUpperCase()}`,
        actual_price: Number(pkg.price),
        offer_price: override ? override.price : Number(pkg.offerPrice ?? pkg.price),
        parameter_count: computePackageParameterCount(pkg),
        reporting_time: pkg.packageTests[0]?.test.reportTime ?? "N/A",
        booked_count: pkg.bookedCount,
        is_added_to_cart: cartedPackageIds.has(pkg.id),
        is_available_in_city: override?.isOffered !== false,
      };
    }),
    tests: popularTests.map((test) => {
      const override = testOverrides.get(test.id);
      return {
        id: test.id,
        slug: test.slug,
        test_name: test.name,
        test_code: test.shortName,
        price: Number(test.price),
        offer_price: override ? override.price : Number(test.offerPrice ?? test.price),
        parameter_count: test._count.parameters || 1,
        reporting_time: test.reportTime,
        booked_count: test.bookedCount,
        is_added_to_cart: cartedTestIds.has(test.id),
        is_available_in_city: override?.isOffered !== false,
        is_parameter: test.sourceParameterId !== null,
      };
    }),
    coupons: homeCoupons.map((c) => ({
      id: c.id,
      coupon_code: c.code,
      title: c.title,
      discount_type: c.discountType.toLowerCase(),
      discount_value: Number(c.discountValue),
      min_booking_amount: c.minSubtotal ? Number(c.minSubtotal) : 0,
      applicable_on: c.applicableOn.toLowerCase(),
      valid_till: c.validTo ? c.validTo.toISOString().slice(0, 10) : null,
    })),
  };
}
