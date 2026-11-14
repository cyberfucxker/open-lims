/** The one place a city landing page's URL is built — `/city/{slug}`.
 *
 *  City pages used to live at the bare `/{slug}`, sharing a component with
 *  the Home page and differing only by which city was selected. They are a
 *  separate page now (`pages/city/CityPage.tsx`), with their own layout and
 *  their own purpose, and the `/city/` prefix says so: a single unclaimed
 *  segment is no longer secretly a city. `/{slug}` still redirects here so
 *  older links and indexed URLs keep working — see `routes/index.tsx`. */
export function buildCityPath(citySlug: string): string {
  return `/${citySlug}`;
}

/** True for a city landing page — a single path segment that is not one of
 *  the app's own top-level routes, i.e. `/jaipur`. The old `/city/jaipur`
 *  shape still redirects to it, so it counts too. */
export function isCityRoute(pathname: string): boolean {
  if (pathname === "/city" || pathname.startsWith("/city/")) return true;
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 1 && !RESERVED_TOP_LEVEL_SEGMENTS.has(segments[0]);
}

/** First path segments already claimed by a real, static top-level route.
 *  Everything else that is a single segment is the Home page carrying a city
 *  (`/jaipur`, produced by `useSyncHomeCityToRoute`), which is what the two
 *  nav bars need to tell apart from an actual named route. Keep this in sync
 *  with the top-level paths declared in `routes/index.tsx`. */
const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "login",
  "otp",
  "complete-profile",
  "forgot-password",
  "city",
  "tests",
  "packages",
  "parameter",
  "cart",
  "addresses",
  "slots",
  "payment",
  "order-confirmation",
  "orders",
  "reports",
  "prescriptions",
  "wallet",
  "profile",
  "feedback",
  "about",
  "franchise",
  "careers",
  "contact",
  "blog",
  "privacy-policy",
  "terms",
  "refund-policy",
  "nearby-labs",
  "get-app",
  "home",
  "catalog",
]);

/** Whether the "Home" nav entry should read as active, in `TopNav` and
 *  `BottomTabBar`. Covers `/` itself and a city landing page (`/jaipur`) —
 *  both are top-of-funnel pages someone arrives on, and dropping the
 *  highlight on either would leave no tab lit at all. */
export function isHomeRoute(pathname: string): boolean {
  return pathname === "/" || isCityRoute(pathname);
}

/** True for either catalog tab ("/tests" or "/packages") and their detail
 *  sub-routes — the two live under one "Tests & Packages" nav entry. A
 *  parameter detail page ("/parameter/{citySlug}/{slug}") counts too: it's a
 *  single bookable analyte, reached from the catalogue and sold exactly like
 *  a test, so the nav shouldn't drop its highlight when one opens. */
export function isCatalogRoute(pathname: string): boolean {
  return (
    pathname === "/tests" ||
    pathname === "/packages" ||
    pathname.startsWith("/tests/") ||
    pathname.startsWith("/packages/") ||
    pathname.startsWith("/parameter/")
  );
}

/** Builds the Tests/Packages LIST url, city-scoped when one is picked —
 *  the list-page counterpart to `TestCard`/`PackageCard`'s
 *  `/tests|packages/{citySlug}/{slug}` detail links. Every nav entry point
 *  (`TopNav`, `BottomTabBar`, the in-page tab switch) goes through this so
 *  browsing with a city selected always lands on `/tests/{citySlug}` instead
 *  of the bare, city-agnostic `/tests`. */
export function buildCatalogPath(kind: "tests" | "packages", citySlug?: string | null): string {
  return citySlug ? `/${kind}/${citySlug}` : `/${kind}`;
}

/** The three detail-URL families, all shaped `/{base}/{citySlug}/{slug}`.
 *  "parameter" is singular deliberately — it addresses one analyte, unlike
 *  the "/tests"/"/packages" list tabs the other two share a prefix with. */
export type CatalogDetailKind = "tests" | "packages" | "parameter";

/** THE one place a Test/Package/Parameter detail URL is built. Every card,
 *  suggestion row, footer link and in-page cross-link goes through this, so a
 *  given catalogue item has exactly one URL no matter where it was clicked —
 *  which is the whole point: two spellings of the same page split its search
 *  ranking and make the canonical tag a lie.
 *
 *  A directly-bookable Parameter is served through its auto-provisioned
 *  shadow Test (`is_parameter`/`isParameter`), so it's a Test row in every
 *  API payload but belongs at `/parameter/{citySlug}/{slug}` — that's what
 *  `isParameter` switches here.
 *
 *  `citySlug`/`slug` missing (no city picked yet, or a payload that predates
 *  slugs) falls back to the plain id route `/tests|packages/{id}` — uglier and
 *  priced city-agnostically, but always resolvable. In practice that's rare:
 *  `useDefaultCityBootstrap` puts a city in the store on first load. */
export function buildCatalogItemPath(options: {
  kind: "tests" | "packages";
  id: string;
  slug?: string | null;
  citySlug?: string | null;
  isParameter?: boolean;
}): string {
  const { kind, id, slug, citySlug, isParameter } = options;
  if (!citySlug || !slug) return `/${kind}/${id}`;
  const base: CatalogDetailKind = kind === "tests" && isParameter ? "parameter" : kind;
  return `/${base}/${citySlug}/${slug}`;
}
