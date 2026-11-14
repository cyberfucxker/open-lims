/** Read-only "what does this actually contain?" projections of a Test or a
 *  Package, shared verbatim between the Superadmin preview and the patient app.
 *  One service (`catalogDetail.service.ts`) produces them; two controllers with
 *  different guards expose them, so the two surfaces can never drift.
 *
 *  There are no admin-only fields here by construction — everything below is
 *  catalogue information a patient is entitled to see before booking. That's
 *  why the same payload can be served to both without a field-stripping step. */

import type { RecommendedGender } from "./parameter.types";

export type { RecommendedGender };

export interface CatalogParameterDetail {
  id: string;
  name: string;
  shortName: string;
  /** The linked `Parameter.doTest`. True = the patient app renders a clickable
   *  "+ Add"; false = a plain, non-interactive list item. */
  bookable: boolean;
  /** The id of the parameter's own auto-provisioned single-parameter Test
   *  (`Test.sourceParameterId` — see its doc-comment), which is what actually
   *  gets added to cart. Non-null whenever `bookable` is true (a `doTest`
   *  parameter always has a shadow Test). */
  testId: string | null;
  /** That same shadow Test's `slug`. Non-null alongside `testId`, and what
   *  the patient app actually links to — `/parameter/{citySlug}/{testSlug}`,
   *  the parameter twin of a Test's own `/tests/{citySlug}/{testSlug}` — so a
   *  bookable analyte gets a readable, city-priced URL instead of the bare
   *  `/tests/{uuid}` this used to build off `testId`. */
  testSlug: string | null;
}

/** The `city` field `getTestDetailForCity`/`getPackageDetailForCity` add on
 *  top of the plain `TestDetail`/`PackageDetail` shape below. */
export interface CityDetailScope {
  name: string;
  slug: string;
}

export interface TestDetail {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  /** The lab's internal taxonomy. Null for a Test categorised only by CMS
   *  category, which is what the admin form now produces. */
  department: string | null;
  /** Department-scoped lab category — null alongside a null `department`. */
  category: string | null;
  /** The CMS category tile, which is what the patient app actually groups by. */
  appCategory: string | null;
  sampleType: string;
  price: number;
  offerPrice: number | null;
  reportTime: string;
  description: string | null;
  /** Long-form SEO body (HTML). Raw `[LOCATION]` token on admin reads; filled
   *  with the city (or "your city") on patient reads. */
  content: string | null;
  /** Patient-facing prep/recommendation, mirroring `PackageDetail`'s own
   *  fields so a Test and a Package present identically in the app. */
  isFastingRequired: boolean;
  fastingHours: number | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  /** In `sortOrder`. Empty for a free-text/unstructured Test — a valid state,
   *  not an error (see the `TestParameter` model doc-comment). */
  parameters: CatalogParameterDetail[];
  /** True for a "shadow" Test auto-provisioned behind a directly-bookable
   *  Parameter (`Test.sourceParameterId` set — see its doc-comment), false
   *  for a real, hand-created Test. Purely a URL/presentation concern: the
   *  patient app serves the former at `/parameter/{citySlug}/{slug}` and the
   *  latter at `/tests/{citySlug}/{slug}`, and each canonicalises to its own
   *  form so one analyte never has two indexable URLs. */
  isParameter: boolean;
}

export interface PackageTestDetail {
  id: string;
  name: string;
  shortName: string;
  /** For the patient app's link to this member test's own detail page —
   *  `/tests/{citySlug}/{slug}`, or `/parameter/...` when `isParameter`. */
  slug: string;
  /** See `TestDetail.isParameter` — a package can hold a shadow Test as a
   *  member (a standalone analyte sold inside the package), and it must link
   *  to the parameter URL, not the test one. */
  isParameter: boolean;
  /** This test's own analytes, so a package page can file each parameter
   *  under the test it came from instead of listing all of them in one flat
   *  block. Deliberately NOT de-duplicated against the other member tests:
   *  an analyte shared by two of them really is part of both, and dropping
   *  it from the second would make that test look shorter than it is. Use
   *  `PackageDetail.parameters` for anything that needs a distinct count. */
  parameters: CatalogParameterDetail[];
}

export interface PackageDetail {
  id: string;
  slug: string;
  name: string;
  /** The CMS category tile. */
  appCategory: string | null;
  /** Declared primary specimen — null for a mixed-specimen package. */
  sampleType: string | null;
  price: number;
  offerPrice: number | null;
  description: string | null;
  /** Declared turnaround; falls back to the first member test's own when the
   *  package doesn't declare one, so this is never blank for a package that has
   *  member tests. */
  reportTime: string | null;
  isFastingRequired: boolean;
  fastingHours: number | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  tests: PackageTestDetail[];
  /** Analytes the package sells directly rather than through a member test —
   *  the subset of `parameters` that appears under no entry in `tests`, and so
   *  the only ones a per-test grouping would otherwise lose. */
  standaloneParameters: CatalogParameterDetail[];
  /** The FULL flattened analyte list: every parameter reached through a member
   *  Test, plus every standalone parameter the package sells directly.
   *  De-duplicated by parameter id — an analyte shared by two member Tests
   *  appears once. */
  parameters: CatalogParameterDetail[];
}
