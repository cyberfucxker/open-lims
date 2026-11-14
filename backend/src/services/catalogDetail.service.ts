import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { resolveCityPriceListId } from "./pricing.service";
import type {
  CatalogParameterDetail,
  CityDetailScope,
  PackageDetail,
  TestDetail,
} from "../types/catalogDetail.types";

/** The ONE implementation of "what does this Test/Package actually contain?".
 *
 *  Two controllers wrap these functions — `catalogDetail.controller.ts` behind
 *  the admin auth stack and `app/catalogDetail.controller.ts` behind the patient
 *  app's guard — so the Superadmin publish-preview and the app's booking screen
 *  can never disagree about a package's contents. The payload holds no
 *  admin-only fields by construction (see `catalogDetail.types.ts`), which is
 *  what lets one shape serve both instead of a stripped-down second variant.
 *
 *  `bookable` on every parameter is verbatim `Parameter.doTest`. */

/** Either lookup key resolves the exact same row/select — `slug` exists
 *  purely so the patient app's SEO-friendly city+item URLs (`/{citySlug}/tests/{testSlug}`)
 *  never need to know a real id, while every other caller keeps using `id`
 *  unchanged. */
type Lookup = { id: string } | { slug: string };

const testDetailSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  // Only to set `isParameter` on the way out — see its doc-comment: it
  // decides which URL family (`/tests/...` vs `/parameter/...`) this row
  // canonically belongs to.
  sourceParameterId: true,
  price: true,
  offerPrice: true,
  reportTime: true,
  description: true,
  content: true,
  status: true,
  isFastingRequired: true,
  fastingHours: true,
  recommendedFor: true,
  recommendedAge: true,
  department: { select: { name: true } },
  category: { select: { name: true } },
  appCategory: { select: { name: true } },
  sampleType: { select: { name: true } },
  parameters: {
    orderBy: { sortOrder: "asc" },
    select: {
      parameter: {
        select: {
          id: true,
          name: true,
          shortName: true,
          doTest: true,
          shadowTest: { select: { id: true, slug: true } },
        },
      },
    },
  },
} satisfies Prisma.TestSelect;

/** The one shape every parameter row in this file goes through — a
 *  `ParameterWithShadow` in, a `CatalogParameterDetail` out. */
interface ParameterWithShadow {
  id: string;
  name: string;
  shortName: string;
  doTest: boolean;
  shadowTest: { id: string; slug: string } | null;
}

function toParameterDetail(parameter: ParameterWithShadow): CatalogParameterDetail {
  const shadow = parameter.doTest ? (parameter.shadowTest ?? null) : null;
  return {
    id: parameter.id,
    name: parameter.name,
    shortName: parameter.shortName,
    bookable: parameter.doTest,
    testId: shadow?.id ?? null,
    testSlug: shadow?.slug ?? null,
  };
}

/** `activeOnly` is what the patient-app surface passes — the app must never
 *  render a retired Test, while the admin preview needs to inspect one before
 *  re-publishing it. Same query either way, so the two can't drift. */
export async function getTestDetail(
  lookup: Lookup,
  options: { activeOnly?: boolean } = {},
): Promise<TestDetail> {
  const test = await prisma.test.findUnique({ where: lookup, select: testDetailSelect });

  // An inactive Test is reported as not-found rather than 403 to the app: its
  // existence isn't a secret, but a retired catalogue entry is indistinguishable
  // from a deleted one from the patient's side. Same pattern as
  // `patient.service.ts#getPatient`'s org scoping.
  if (!test || (options.activeOnly && test.status !== "Active")) {
    throw ApiError.notFound("Test not found");
  }

  return {
    id: test.id,
    slug: test.slug,
    name: test.name,
    shortName: test.shortName,
    department: test.department?.name ?? null,
    category: test.category?.name ?? null,
    appCategory: test.appCategory?.name ?? null,
    sampleType: test.sampleType.name,
    price: Number(test.price),
    offerPrice: test.offerPrice === null ? null : Number(test.offerPrice),
    reportTime: test.reportTime,
    description: test.description,
    content: test.content,
    isFastingRequired: test.isFastingRequired,
    fastingHours: test.fastingHours,
    recommendedFor: test.recommendedFor as TestDetail["recommendedFor"],
    recommendedAge: test.recommendedAge,
    parameters: test.parameters.map((row) => toParameterDetail(row.parameter)),
    isParameter: test.sourceParameterId !== null,
  };
}

/** Flattens a Package to the full analyte list a patient sees before booking:
 *  every parameter of every member Test, plus every standalone parameter the
 *  package sells directly. De-duplicated by parameter id (two member Tests
 *  sharing an analyte list it once) with first-seen order preserved — member
 *  Tests in package order, then the direct parameters. */
export async function getPackageDetail(
  lookup: Lookup,
  options: { activeOnly?: boolean } = {},
): Promise<PackageDetail> {
  const pkg = await prisma.package.findFirst({
    where: {
      ...lookup,
      deletedAt: null,
      ...(options.activeOnly ? { active: true } : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      offerPrice: true,
      description: true,
      reportTime: true,
      isFastingRequired: true,
      fastingHours: true,
      recommendedFor: true,
      recommendedAge: true,
      appCategory: { select: { name: true } },
      sampleType: { select: { name: true } },
      packageTests: {
        select: {
          test: {
            select: {
              id: true,
              name: true,
              shortName: true,
              slug: true,
              sourceParameterId: true,
              reportTime: true,
              parameters: {
                orderBy: { sortOrder: "asc" },
                select: {
                  parameter: {
                    select: {
                      id: true,
                      name: true,
                      shortName: true,
                      doTest: true,
                      shadowTest: { select: { id: true, slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      packageParameters: {
        select: {
          parameter: {
            select: {
              id: true,
              name: true,
              shortName: true,
              doTest: true,
              shadowTest: { select: { id: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!pkg) {
    throw ApiError.notFound("Package not found");
  }

  const parameters: CatalogParameterDetail[] = [];
  const seen = new Set<string>();

  function push(parameter: ParameterWithShadow) {
    if (seen.has(parameter.id)) return;
    seen.add(parameter.id);
    parameters.push(toParameterDetail(parameter));
  }

  for (const packageTest of pkg.packageTests) {
    for (const row of packageTest.test.parameters) {
      push(row.parameter);
    }
  }
  for (const row of pkg.packageParameters) {
    push(row.parameter);
  }

  // The same analytes again, but kept under the test they belong to rather
  // than flattened. `parameters` above stays as it was — de-duplicated across
  // the whole package — because a count of "44 parameters" has to mean 44
  // distinct things; these per-test lists deliberately do NOT de-duplicate,
  // since an analyte shared by two member tests really is part of both and
  // dropping it from the second would make that test look short.
  //
  // Costs no extra query: the parameters were already loaded per test to
  // build the flat list.
  const testsWithParameters = pkg.packageTests.map((pt) => ({
    id: pt.test.id,
    name: pt.test.name,
    shortName: pt.test.shortName,
    slug: pt.test.slug,
    isParameter: pt.test.sourceParameterId !== null,
    parameters: pt.test.parameters.map((row) => toParameterDetail(row.parameter)),
  }));

  // Analytes attached to the package directly rather than through a member
  // test. They belong to no test, so the UI has nowhere to file them — it
  // shows them as their own group.
  const standaloneParameterIds = new Set(pkg.packageParameters.map((row) => row.parameter.id));
  for (const test of testsWithParameters) {
    for (const parameter of test.parameters) standaloneParameterIds.delete(parameter.id);
  }
  const standaloneParameters = parameters.filter((p) => standaloneParameterIds.has(p.id));

  return {
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    appCategory: pkg.appCategory?.name ?? null,
    sampleType: pkg.sampleType?.name ?? null,
    price: Number(pkg.price),
    offerPrice: pkg.offerPrice === null ? null : Number(pkg.offerPrice),
    description: pkg.description,
    // Same precedence the app catalogue list uses: the package's own declared
    // turnaround wins, otherwise the first-listed member test's (the seed orders
    // member tests slowest-first for exactly this reason).
    reportTime: pkg.reportTime ?? pkg.packageTests[0]?.test.reportTime ?? null,
    isFastingRequired: pkg.isFastingRequired,
    fastingHours: pkg.fastingHours,
    recommendedFor: pkg.recommendedFor as PackageDetail["recommendedFor"],
    recommendedAge: pkg.recommendedAge,
    tests: testsWithParameters,
    parameters,
    standaloneParameters,
  };
}

/** Resolves an active City by its URL slug — the one extra lookup the
 *  SEO city+item routes need beyond the plain id/slug ones above. 404s (not a
 *  silent fallback to the global catalogue) since an unrecognised city in the
 *  URL means the link itself is wrong, not that pricing should quietly
 *  degrade. */
async function resolveActiveCityBySlug(citySlug: string) {
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  if (!city || !city.isActive) {
    throw ApiError.notFound("City not found");
  }
  return city;
}

/** A single-item version of `catalog.service.ts#loadCityOverrides` — that one
 *  loads every override for a whole list page, this loads (at most) one, for
 *  a single already-known item id. `isOffered: false` reads as "not sold in
 *  this city" — 404, same as `catalog.service.ts`'s list endpoints simply
 *  omitting the row, just surfaced explicitly here since a detail page has
 *  exactly one item to be right or wrong about. */
async function resolveCityOverride(
  priceListId: string | null,
  itemType: "TEST" | "PACKAGE",
  itemId: string,
): Promise<{ price: number; isOffered: boolean } | null> {
  if (!priceListId) return null;
  const row = await prisma.priceListItem.findFirst({
    where: { priceListId, itemType, itemId },
    select: { price: true, isOffered: true },
  });
  return row ? { price: Number(row.price), isOffered: row.isOffered } : null;
}

/** City+slug twin of `getTestDetail` for the patient app's SEO landing pages
 *  (`/{citySlug}/tests/{testSlug}`) — same shape, plus `city`, and the sale
 *  price swapped for that city's own price-list override when one exists
 *  (mirroring `catalog.service.ts#listTests`'s city-scoped pricing, which the
 *  plain id-based detail route has never applied). */
/** `Test.content` is written once for every city with a literal
 *  `[LOCATION]` token (any case) — swapped for the page's city here. Without a
 *  city (the plain id-based app route) it reads "your city", so a patient
 *  never sees the raw token. Admin reads keep the token untouched. */
export function fillLocation(content: string | null, cityName: string | null): string | null {
  if (!content) return content;
  return content.replace(/\[LOCATION\]/gi, cityName?.trim() || "your city");
}

export async function getTestDetailForCity(
  citySlug: string,
  testSlug: string,
): Promise<TestDetail & { city: CityDetailScope }> {
  const city = await resolveActiveCityBySlug(citySlug);
  const detail = await getTestDetail({ slug: testSlug }, { activeOnly: true });

  const priceListId = await resolveCityPriceListId(city.id);
  const override = await resolveCityOverride(priceListId, "TEST", detail.id);
  if (override?.isOffered === false) {
    throw ApiError.notFound("Test not found");
  }

  return {
    ...detail,
    content: fillLocation(detail.content, city.name),
    offerPrice: override ? override.price : detail.offerPrice,
    city: { name: city.name, slug: city.slug },
  };
}

/** City+slug twin of `getPackageDetail` — see `getTestDetailForCity`'s
 *  doc-comment, same rules. */
export async function getPackageDetailForCity(
  citySlug: string,
  packageSlug: string,
): Promise<PackageDetail & { city: CityDetailScope }> {
  const city = await resolveActiveCityBySlug(citySlug);
  const detail = await getPackageDetail({ slug: packageSlug }, { activeOnly: true });

  const priceListId = await resolveCityPriceListId(city.id);
  const override = await resolveCityOverride(priceListId, "PACKAGE", detail.id);
  if (override?.isOffered === false) {
    throw ApiError.notFound("Package not found");
  }

  return {
    ...detail,
    offerPrice: override ? override.price : detail.offerPrice,
    city: { name: city.name, slug: city.slug },
  };
}
