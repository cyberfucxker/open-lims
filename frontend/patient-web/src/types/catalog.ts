export interface AppBanner {
  id: string;
  image: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  image: string | null;
  thumbnail: string | null;
}

export interface PackageCatalogItem {
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
  includes?: Array<{ name: string }>;
  tag?: "Popular" | null;
  /** Only set on `HomeResult.packages[]` — the resolved city's price list
   *  says this franchise doesn't sell it. Absent (not `false`) on every
   *  other list, which drops a not-offered-here row instead of flagging it. */
  is_available_in_city?: boolean;
}

export interface TestCatalogItem {
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
  /** See `PackageCatalogItem.is_available_in_city`'s doc-comment — same rule,
   *  only ever set on `HomeResult.tests[]`. */
  is_available_in_city?: boolean;
  /** True when this row is really a directly-bookable Parameter, served
   *  through its auto-provisioned "shadow" Test — the Tests catalogue mixes
   *  both kinds deliberately. Matters for exactly one thing: which detail URL
   *  the card links to, `/parameter/{citySlug}/{slug}` instead of
   *  `/tests/{citySlug}/{slug}`. See `buildCatalogItemPath`. */
  is_parameter?: boolean;
}

/** `GET /user/tests` / `/user/packages`'s page envelope — 20 items per page
 *  by default (see `catalog.service.ts#paginate` on the backend). */
export interface PaginatedCatalog<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type CouponDiscountType = "flat" | "percentage";
export type CouponApplicableOn = "all" | "tests" | "packages";

export interface HomeCoupon {
  id: string;
  coupon_code: string;
  title: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_booking_amount: number;
  applicable_on: CouponApplicableOn;
  valid_till: string | null;
}

/** A promoted package's LIVE, city-scoped numbers on a `WebBanner` slide —
 *  never typed by an admin, always read off the package at request time (see
 *  `home.service.ts`). Absent on a slide with no package attached, which
 *  renders as a plain promo with no price block. */
export interface WebBannerPackage {
  id: string;
  slug: string;
  name: string;
  parameter_count: number;
  price: number;
  offer_price: number;
  discount_percent: number;
}

/** Home page masthead artwork (Superadmin CMS > Web Banner, placement
 *  "Home"). Image and nothing else: the Home hero paints its own heading,
 *  search box and buttons over these, so there is no copy for an admin to
 *  write and none to render. Separate from `WebBanner` below, which is the
 *  city pages' image-plus-copy card — keeping the two lists apart is the
 *  whole reason the placement exists. */
export interface HomeBanner {
  id: string;
  image: string;
  /** Where the artwork leads when tapped, or null for a decorative slide. */
  link_url: string | null;
}

/** The CITY pages' hero card (Superadmin CMS > Web Banner, placement
 *  "City") — distinct from
 *  `AppBanner`/`app_banners`, which is the mobile app's image-only strip.
 *  These slides carry their own copy and, optionally, a linked Package whose
 *  price/discount/parameter-count is always current. */
export interface WebBanner {
  id: string;
  badge: string | null;
  title: string;
  subtitle: string | null;
  image: string;
  package: WebBannerPackage | null;
  link_url: string | null;
}

export interface HomeResult {
  app_banners: AppBanner[];
  home_banners: HomeBanner[];
  web_banners: WebBanner[];
  categories: CategoryItem[];
  packages: PackageCatalogItem[];
  tests: TestCatalogItem[];
  coupons: HomeCoupon[];
}

/** type: "1" = package, "3" = test — inverted vs. Review-Cart's item.type (1=test, 2=package). */
export type AddToCartItemType = "1" | "3";

export interface AddToCartRequest {
  family_member_id?: string;
  type: AddToCartItemType;
  type_id: string;
}

export type RecommendedGender = "MALE" | "FEMALE" | "BOTH";

/** One analyte inside a Test or Package detail. `bookable` mirrors the
 *  parameter's `doTest` flag — true is rendered as a highlighted, on-its-own
 *  bookable item; false as a plain, disabled-looking "part of the test" row. */
export interface CatalogParameterDetail {
  id: string;
  name: string;
  shortName: string;
  bookable: boolean;
  /** The id of the parameter's own auto-provisioned single-parameter Test —
   *  non-null whenever `bookable` is true. What actually gets added to cart. */
  testId: string | null;
  /** That shadow Test's slug — non-null alongside `testId`, and what
   *  `ParameterList` actually links to: `/parameter/{citySlug}/{testSlug}`,
   *  so a bookable analyte gets the same readable, city-priced URL shape a
   *  Test has instead of a bare `/tests/{uuid}`. */
  testSlug: string | null;
}

/** The `city` field the SEO city-slug detail routes add on top of the plain
 *  shape below (`getTestDetailBySlug`/`getPackageDetailBySlug`) — absent on
 *  the plain id-based lookup. */
export interface CityDetailScope {
  name: string;
  slug: string;
}

/** `GET /tests/:id/details` — shared shape with the Superadmin preview. */
export interface TestDetail {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  department: string | null;
  category: string | null;
  appCategory: string | null;
  sampleType: string;
  price: number;
  offerPrice: number | null;
  reportTime: string;
  description: string | null;
  /** Long-form website page body (HTML), `[LOCATION]` already filled with the
   *  city by the API. Shown in place of `description` when present. */
  content?: string | null;
  isFastingRequired: boolean;
  fastingHours: number | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  parameters: CatalogParameterDetail[];
  city?: CityDetailScope;
  /** True for the shadow Test behind a directly-bookable Parameter, false for
   *  a real, hand-created Test. Decides which URL family this detail page
   *  canonically lives in — `/parameter/...` vs `/tests/...` — and so also
   *  whether `TestDetailPage` redirects a URL that used the other one. */
  isParameter: boolean;
}

export interface PackageTestDetail {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  /** See `TestDetail.isParameter` — a package can hold a standalone analyte's
   *  shadow Test as a member, and it links to the parameter URL. */
  isParameter: boolean;
  /** This test's own analytes, so the package page can file each parameter
   *  under the test it came from rather than listing all of them in one flat
   *  block. Not de-duplicated against sibling tests — an analyte shared by
   *  two of them belongs to both. Use `PackageDetail.parameters` when a
   *  distinct count is what's needed. */
  parameters: CatalogParameterDetail[];
}

/** `GET /packages/:id/details`. `parameters` is the FULL flattened, de-duplicated
 *  analyte list across every member test plus the package's own standalone ones. */
export interface PackageDetail {
  id: string;
  slug: string;
  name: string;
  appCategory: string | null;
  sampleType: string | null;
  price: number;
  offerPrice: number | null;
  description: string | null;
  reportTime: string | null;
  isFastingRequired: boolean;
  fastingHours: number | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  tests: PackageTestDetail[];
  parameters: CatalogParameterDetail[];
  /** Analytes sold by the package directly rather than through a member test
   *  — the ones a per-test grouping has nowhere to file, shown as their own
   *  group. */
  standaloneParameters: CatalogParameterDetail[];
  city?: CityDetailScope;
}
