import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { resolveCityPriceListId } from "../pricing.service";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export interface PaginationParams {
  page?: number | null;
  pageSize?: number | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** A package's real analyte count — de-duplicated across every member test's
 *  attached parameters plus the package's own standalone parameters, which is
 *  what GET /app/packages/:id/details lists. Shared by every place a package
 *  card's "N parameters" badge is computed (catalog browse, Home's popular
 *  packages, and Home's web-banner package preview) so they can't drift back
 *  out of step with each other the way Home's once did by standing in with
 *  the member-test count instead. Falls back to the test count only for a
 *  package whose tests are all free-text (no parameter attachments), so the
 *  badge never reads "0 parameters" — same fallback as `listTests`'s `|| 1`. */
export function computePackageParameterCount(pkg: {
  packageTests: Array<{ test: { parameters: Array<{ parameterId: string }> } }>;
  packageParameters: Array<{ parameterId: string }>;
}): number {
  const parameterIds = new Set<string>();
  for (const pt of pkg.packageTests) {
    for (const attachment of pt.test.parameters) parameterIds.add(attachment.parameterId);
  }
  for (const pp of pkg.packageParameters) parameterIds.add(pp.parameterId);
  return parameterIds.size || pkg.packageTests.length;
}

/** Slices an already-fetched, already-filtered row set into one page.
 *  Not a DB-level `skip`/`take`: the city price-list `isOffered` exclusion
 *  (see `loadCityOverrides`) only resolves after every candidate row is
 *  fetched, so the full (small — low thousands, tops) catalogue is always
 *  loaded and filtered in memory first; this just slices the tail end of
 *  that same in-memory work rather than adding a second query. */
function paginate<T>(rows: T[], params?: PaginationParams): PaginatedResult<T> {
  const page = params?.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const total = rows.length;
  const start = (page - 1) * pageSize;

  return {
    items: rows.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Per-item `{ price, isOffered }` override from the resolved city price
 *  list, keyed by catalogue item id — `undefined` for an item with no row
 *  (offered, at the catalogue's own price; see `PriceListItem.isOffered`'s
 *  doc-comment for why absence and `isOffered:true` mean the same thing). */
export type OverrideMap = Map<string, { price: number; isOffered: boolean }>;

/** Exported for `home.service.ts#getHome`, which needs the exact same
 *  per-city price/availability lookup for its "Popular Tests"/"Popular
 *  Packages" rows — one query shape, so the two surfaces can't drift. */
export async function loadCityOverrides(
  priceListId: string | null,
  itemType: "TEST" | "PACKAGE",
): Promise<OverrideMap> {
  if (!priceListId) return new Map();

  const rows = await prisma.priceListItem.findMany({
    where: { priceListId, itemType },
    select: { itemId: true, price: true, isOffered: true },
  });
  return new Map(
    rows.map((row) => [row.itemId, { price: Number(row.price), isOffered: row.isOffered }]),
  );
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
  /** True when this row is the "shadow" Test behind a directly-bookable
   *  Parameter (`Test.sourceParameterId` set) rather than a real,
   *  hand-created Test — the two are deliberately indistinguishable in this
   *  list otherwise (see the doc-comment on `listTests`). The app needs the
   *  distinction for one thing only: which URL family the card links to,
   *  `/parameter/{citySlug}/{slug}` vs `/tests/{citySlug}/{slug}`. */
  is_parameter: boolean;
}

/** Shared rank comparator for anywhere a Test list needs to reflect the
 *  admin's curated order (catalogue browse, Home's "Popular Tests", search
 *  suggestions). A shadow Test (see `Test.sourceParameterId`'s doc-comment)
 *  never got its own curated position — `shadowTest.service.ts` always
 *  creates it with `sortOrder: 0` — so its effective rank borrows its
 *  source Parameter's `sortOrder` instead. A real, hand-created Test has no
 *  `sourceParameter` and just uses its own `sortOrder`. `name` is the
 *  tie-break so items sharing a rank (or the `0` default) don't order by
 *  pure accident. Callers must `include: { sourceParameter: { select: {
 *  sortOrder: true } } }` for the borrowed rank to be there to read. */
export function testRankComparator(
  a: { sortOrder: number; name: string; sourceParameter?: { sortOrder: number } | null },
  b: { sortOrder: number; name: string; sourceParameter?: { sortOrder: number } | null },
): number {
  const rankA = a.sourceParameter?.sortOrder ?? a.sortOrder;
  const rankB = b.sourceParameter?.sortOrder ?? b.sortOrder;
  return rankA - rankB || a.name.localeCompare(b.name);
}

/** `appUserId` is `null` for a guest browsing without a Bearer token —
 *  `is_added_to_cart` just comes back `false` for every row in that case.
 *  `cityId` is optional (guest hasn't picked a city, or picked one with no
 *  parent franchise yet) — see `resolveCityPriceListId`'s doc-comment for
 *  what happens then: the full global catalogue, unfiltered.
 *  `categoryId` is the Home screen's category tile id (`AppCategory.id`,
 *  same taxonomy as `/api/v1/app/user/home`'s `categories[]`) — optional,
 *  omit for every category.
 *
 *  Alongside curated Tests, this includes every directly-bookable Parameter
 *  (`doTest = true`) that's ALSO curated `isCommonlyUsed` — each one's
 *  auto-provisioned "shadow" Test (see `Test.sourceParameterId`'s
 *  doc-comment) is a real row in this same query, not a separate merge
 *  step. The hundreds of `doTest` Parameters that aren't `isCommonlyUsed`
 *  stay out of this list entirely (their shadow Test still exists and is
 *  still fully bookable by id/slug — e.g. from a Test/Package detail page
 *  — it just doesn't clutter this catalogue browse).
 *
 *  `curatedOnly` (default `true`) is that `isCommonlyUsed` restriction —
 *  pass `false` to lift it and match every `doTest` Parameter's shadow Test
 *  too. Used by `searchSuggestions`: a passive browse should stay curated
 *  (~50 items, not ~800), but someone who's typed a specific name into
 *  search already knows what they want — if it's bookable, it should be
 *  findable, curated or not. */
export async function listTests(
  appUserId: string | null,
  cityId?: string | null,
  categoryId?: string | null,
  pagination?: PaginationParams,
  search?: string | null,
  curatedOnly = true,
): Promise<PaginatedResult<TestCatalogItem>> {
  const [tests, cartedIds, priceListId] = await Promise.all([
    prisma.test.findMany({
      where: {
        status: "Active",
        ...(categoryId ? { appCategoryId: categoryId } : {}),
        AND: [
          // A shadow Test (see Test.sourceParameterId) only counts here when
          // its source Parameter is curated `isCommonlyUsed` — hundreds of
          // directly-bookable Parameters would otherwise bury the curated
          // Tests catalogue under obscure analytes nobody searches for by
          // name. A real, hand-created Test (sourceParameterId null) is
          // never affected by this. Skipped entirely when `curatedOnly` is
          // false (search-suggestions): every shadow Test counts there.
          ...(curatedOnly
            ? [{ OR: [{ sourceParameterId: null }, { sourceParameter: { isCommonlyUsed: true } }] }]
            : []),
          ...(search
            ? [
                {
                  OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { shortName: { contains: search, mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
        ],
      },
      include: {
        _count: { select: { parameters: true } },
        // A shadow Test never got its own curated position (see
        // shadowTest.service.ts — it's always created with sortOrder 0), so
        // its ranking below borrows its source Parameter's sortOrder
        // instead. A real, hand-created Test has no sourceParameter and
        // just uses its own sortOrder.
        sourceParameter: { select: { sortOrder: true } },
      },
    }),
    cartedItemIds(appUserId, "TEST"),
    resolveCityPriceListId(cityId),
  ]);
  const overrides = await loadCityOverrides(priceListId, "TEST");

  // Sorted in JS rather than the query's `orderBy` — a shadow Test's
  // effective rank comes from a *different row* (its source Parameter), a
  // conditional Prisma can't express in one `orderBy`. The full catalogue
  // is already loaded into memory before pagination (see `paginate`'s
  // doc-comment), so this adds no extra query.
  tests.sort(testRankComparator);

  const items = tests
    .filter((test) => overrides.get(test.id)?.isOffered !== false)
    .map((test) => {
      const override = overrides.get(test.id);
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
        is_added_to_cart: cartedIds.has(test.id),
        is_parameter: test.sourceParameterId !== null,
      };
    });

  return paginate(items, pagination);
}

export interface PackageCatalogItem {
  id: string;
  slug: string;
  package_name: string;
  package_code: string;
  offer_price: number;
  actual_price: number;
  parameter_count: number;
  includes: Array<{ name: string }>;
  reporting_time: string;
  booked_count: number;
  is_added_to_cart: boolean;
  tag: string | null;
}

/** `appUserId` is `null` for a guest browsing without a Bearer token —
 *  `is_added_to_cart` just comes back `false` for every row in that case.
 *  `cityId` / `categoryId` — see `listTests`'s doc-comment; same rules. */
export async function listPackages(
  appUserId: string | null,
  cityId?: string | null,
  categoryId?: string | null,
  pagination?: PaginationParams,
  search?: string | null,
): Promise<PaginatedResult<PackageCatalogItem>> {
  const [packages, cartedIds, priceListId] = await Promise.all([
    prisma.package.findMany({
      where: {
        active: true,
        deletedAt: null,
        ...(categoryId ? { appCategoryId: categoryId } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        packageTests: { include: { test: { include: { parameters: true } } } },
        packageParameters: true,
      },
      // Admin's own curated order first (same convention as Test/Parameter's
      // sortOrder — see listTests's doc-comment), `name` as the tie-break so
      // a fresh catalogue doesn't order alphabetically by pure accident.
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    cartedItemIds(appUserId, "PACKAGE"),
    resolveCityPriceListId(cityId),
  ]);
  const overrides = await loadCityOverrides(priceListId, "PACKAGE");

  const items = packages
    .filter((pkg) => overrides.get(pkg.id)?.isOffered !== false)
    .map((pkg) => {
      const override = overrides.get(pkg.id);

      return {
        id: pkg.id,
        slug: pkg.slug,
        package_name: pkg.name,
        package_code: `PKG-${pkg.id.slice(0, 6).toUpperCase()}`,
        offer_price: override ? override.price : Number(pkg.offerPrice ?? pkg.price),
        actual_price: Number(pkg.price),
        parameter_count: computePackageParameterCount(pkg),
        includes: pkg.packageTests.map((pt) => ({ name: pt.test.name })),
        // The package's own declared turnaround now wins; deriving it from the
        // first-listed member test stays as the fallback for packages that
        // don't declare one (the pre-existing behaviour).
        reporting_time: pkg.reportTime ?? pkg.packageTests[0]?.test.reportTime ?? "N/A",
        booked_count: pkg.bookedCount,
        is_added_to_cart: cartedIds.has(pkg.id),
        tag: pkg.isPopular ? "Popular" : null,
      };
    });

  return paginate(items, pagination);
}

const SUGGESTION_LIMIT = 5;

export interface SearchSuggestionsResult {
  tests: TestCatalogItem[];
  packages: PackageCatalogItem[];
}

/** Home page's search-as-you-type dropdown — top 5 Tests + top 5 Packages
 *  matching `query`, nothing else to fetch or page through. Reuses
 *  `listTests`/`listPackages`, but with `listTests`'s `curatedOnly` lifted
 *  (`false`): the Tests catalogue browse deliberately hides an uncurated
 *  `doTest` Parameter (~800 of them would otherwise bury the ~50 curated
 *  ones), but a search is an explicit, specific ask — if someone typed the
 *  exact name of a bookable Parameter, it should be findable regardless of
 *  curation. A non-bookable Parameter (`doTest = false`) has no shadow Test
 *  at all either way, so it's never a candidate here. */
export async function searchSuggestions(
  appUserId: string | null,
  cityId: string | null | undefined,
  query: string,
): Promise<SearchSuggestionsResult> {
  const pagination = { page: 1, pageSize: SUGGESTION_LIMIT };
  const [testsResult, packagesResult] = await Promise.all([
    listTests(appUserId, cityId, null, pagination, query, false),
    listPackages(appUserId, cityId, null, pagination, query),
  ]);
  return { tests: testsResult.items, packages: packagesResult.items };
}

export async function cartedItemIds(
  appUserId: string | null,
  itemType: "TEST" | "PACKAGE",
): Promise<Set<string>> {
  if (!appUserId) return new Set(); // guest — nothing carted, no query to run

  const items = await prisma.cartItem.findMany({
    where: { itemType, cart: { appUserId } },
    select: { itemId: true },
  });
  return new Set(items.map((i) => i.itemId));
}

export interface AddToCartInput {
  /** Single-member form — the original contract, still what the live Flutter
   *  build sends. Blank/omitted means the account holder. */
  family_member_id?: string;
  /** Multi-member form: add the same test/package for several people in one
   *  call, one cart line each. Wins over `family_member_id` when both are
   *  sent. */
  family_member_ids?: string[];
  type: "1" | "3";
  type_id: string;
}

export interface AddToCartResult {
  /** Everyone this item is now in the cart for, after the call — including
   *  members it was already there for, since adding twice is a no-op rather
   *  than an error. Lets the client refresh its "booking for" chips without
   *  a second Get Cart round trip. */
  family_member_ids: string[];
}

/** Resolves who this item is being added for, and proves every one of them
 *  belongs to the caller — a family member id is a plain uuid in the request
 *  body, so without this check one account could load items onto another
 *  account's member. Order of precedence: explicit list, then the legacy
 *  single field, then the account holder's own SELF member. */
async function resolveCartMembers(appUserId: string, input: AddToCartInput): Promise<string[]> {
  const requested =
    input.family_member_ids && input.family_member_ids.length > 0
      ? [...new Set(input.family_member_ids)]
      : input.family_member_id
        ? [input.family_member_id]
        : [];

  if (requested.length === 0) {
    // Blank family_member_id (today's client default) maps to the account
    // holder, never left ambiguously "for nobody" — see api.md's Business
    // Logic note on this endpoint.
    const self = await resolveSelfFamilyMemberId(appUserId);
    return self ? [self] : [];
  }

  const owned = await prisma.familyMember.findMany({
    where: { id: { in: requested }, appUserId },
    select: { id: true },
  });
  if (owned.length !== requested.length) {
    throw ApiError.notFound("Family member not found");
  }
  return requested;
}

export async function resolveSelfFamilyMemberId(appUserId: string): Promise<string | null> {
  const self = await prisma.familyMember.findFirst({ where: { appUserId, relation: "SELF" } });
  return self?.id ?? null;
}

export async function addToCart(
  appUserId: string,
  input: AddToCartInput,
): Promise<AddToCartResult> {
  const itemType = input.type === "1" ? "PACKAGE" : "TEST";

  if (itemType === "TEST") {
    const test = await prisma.test.findUnique({ where: { id: input.type_id } });
    if (!test || test.status !== "Active") {
      throw ApiError.badRequest("Item not found or unavailable");
    }
  } else {
    const pkg = await prisma.package.findUnique({
      where: { id: input.type_id },
      include: { _count: { select: { packageTests: true } } },
    });
    if (!pkg || !pkg.active || pkg.deletedAt) {
      throw ApiError.badRequest("Item not found or unavailable");
    }
    // A package bills through its member tests (see `expandToTestIds`), so one
    // built purely from standalone parameters has nothing to charge for yet.
    // Refuse it here rather than letting checkout fail on an empty test list.
    if (pkg._count.packageTests === 0) {
      throw ApiError.badRequest("This package isn't available for booking yet");
    }
  }

  const familyMemberIds = await resolveCartMembers(appUserId, input);

  const cart = await prisma.cart.upsert({
    where: { appUserId },
    update: {},
    create: { appUserId },
  });

  // One line per member. `CartItem` is unique on
  // (cartId, itemType, itemId, familyMemberId), so the same test for two
  // people is two legitimate rows — and re-adding for a member already in
  // the cart hits that index and is skipped rather than failing the whole
  // call. `createMany` with `skipDuplicates` does both in one statement.
  await prisma.cartItem.createMany({
    data: familyMemberIds.map((familyMemberId) => ({
      cartId: cart.id,
      itemType,
      itemId: input.type_id,
      familyMemberId,
    })),
    skipDuplicates: true,
  });

  return { family_member_ids: familyMemberIds };
}
