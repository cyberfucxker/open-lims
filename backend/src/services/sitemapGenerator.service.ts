import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/** Google's own cap is 50,000 URLs (or 50MB uncompressed) per sitemap file —
 *  this leaves headroom rather than writing right up to the limit. Crossing
 *  it is a real near-term risk here: every active city crossed with every
 *  active Test (curated ones AND the hundreds of auto-provisioned shadow
 *  Tests behind directly-bookable Parameters — see `Test.sourceParameterId`)
 *  is already tens of thousands of URLs. */
const MAX_URLS_PER_FILE = 40_000;

/** Plain, low-churn routes with no backend-managed list behind them — kept
 *  as a small hardcoded set rather than trying to derive it from routing
 *  code. Blog POST detail pages aren't included: `BLOG_POSTS` lives in
 *  patient-web's own source (`src/data/blogPosts.ts`), not a database table
 *  this backend can read — so they're outside what this generator (or any
 *  future admin action) can keep live. Moving blog posts into a real
 *  backend-managed table would let them join this list. */
const STATIC_PAGES: Array<{ path: string; priority: string }> = [
  { path: "/", priority: "1.0" },
  { path: "/tests", priority: "0.9" },
  { path: "/packages", priority: "0.9" },
  { path: "/about", priority: "0.5" },
  { path: "/franchise", priority: "0.5" },
  { path: "/careers", priority: "0.4" },
  { path: "/contact", priority: "0.5" },
  { path: "/blog", priority: "0.6" },
  { path: "/privacy-policy", priority: "0.3" },
  { path: "/terms", priority: "0.3" },
  { path: "/refund-policy", priority: "0.3" },
];

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, opts: { lastmod?: string; priority?: string } = {}): string {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod.slice(0, 10)}</lastmod>` : null,
    opts.priority ? `    <priority>${opts.priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

function wrapUrlset(entries: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

/** Splits a long entry list across `{base}.xml`, `{base}-2.xml`, … so no
 *  single file crosses `MAX_URLS_PER_FILE` — see its own doc-comment.
 *  Returns the filenames written, in order, for the index to reference.
 *  Always writes at least one (empty) file, so the index never links to a
 *  filename that doesn't exist yet. */
async function writeChunked(outDir: string, base: string, entries: string[]): Promise<string[]> {
  if (entries.length === 0) {
    const filename = `${base}.xml`;
    await fs.writeFile(path.join(outDir, filename), wrapUrlset([]));
    return [filename];
  }

  const filenames: string[] = [];
  for (let i = 0; i * MAX_URLS_PER_FILE < entries.length; i++) {
    const chunk = entries.slice(i * MAX_URLS_PER_FILE, (i + 1) * MAX_URLS_PER_FILE);
    const filename = i === 0 ? `${base}.xml` : `${base}-${i + 1}.xml`;
    await fs.writeFile(path.join(outDir, filename), wrapUrlset(chunk));
    filenames.push(filename);
  }
  return filenames;
}

/** Rebuilds every sitemap file — one per category (Pages, Cities, Tests,
 *  Packages) plus an index referencing them all, per the Sitemap Index
 *  convention, written to both `sitemap_index.xml` (kept for anything
 *  already pointing at it) and `sitemap.xml` (the address search engines
 *  actually expect, per an SEO audit — same content, two filenames, neither
 *  a redirect) — straight into `env.SITEMAP_OUTPUT_DIR`, the
 *  same static folder your web server serves the patient-web build from. No separate build step: whatever's
 *  on disk here IS what a crawler gets, live.
 *
 *  A no-op (logged, not thrown) when `SITEMAP_OUTPUT_DIR` isn't set — the
 *  expected state for local dev, where there's no such folder to write into.
 *  Called from `server.ts`'s boot sequence (self-heals after every deploy/PM2
 *  restart) and, in the background, after every City/Test/Package create,
 *  update, or status change (see each service's own call site) — never
 *  awaited by those callers, since rebuilding tens of thousands of URLs has
 *  no business adding latency to an admin's Save click. */
export async function regenerateSitemap(): Promise<void> {
  const outDir = env.SITEMAP_OUTPUT_DIR;
  if (!outDir) {
    logger.info("SITEMAP_OUTPUT_DIR not set — skipping sitemap regeneration.");
    return;
  }

  const origin = env.SITEMAP_SITE_ORIGIN.replace(/\/+$/, "");

  await fs.mkdir(outDir, { recursive: true });

  const [cities, tests, packages] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.test.findMany({
      where: {
        status: "Active",
        // Same curation rule as the app's Tests catalogue browse
        // (catalog.service.ts#listTests's `curatedOnly`): a real,
        // hand-created Test (sourceParameterId null) always counts; a
        // shadow Test (see Test.sourceParameterId) only counts once its
        // source Parameter is curated `isCommonlyUsed` too. Without this,
        // every one of the hundreds of obscure directly-bookable-but-
        // uncurated Parameters would get its own SEO page per city — bloat
        // with near-zero search value, and it was blowing the per-file URL
        // cap (see MAX_URLS_PER_FILE).
        OR: [{ sourceParameterId: null }, { sourceParameter: { isCommonlyUsed: true } }],
      },
      // `sourceParameterId` only to split the two URL families apart below.
      select: { slug: true, updatedAt: true, sourceParameterId: true },
    }),
    prisma.package.findMany({
      where: { active: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  // 1. Static pages — no per-item data, just the hardcoded list above.
  const pageEntries = STATIC_PAGES.map((p) =>
    urlEntry(`${origin}${p.path}`, { priority: p.priority }),
  );
  await fs.writeFile(path.join(outDir, "sitemap-pages.xml"), wrapUrlset(pageEntries));

  // 2. Cities — each city's own `/{citySlug}` home page.
  const cityEntries = cities.map((c) => urlEntry(`${origin}/${c.slug}`, { priority: "0.7" }));
  await fs.writeFile(path.join(outDir, "sitemap-cities.xml"), wrapUrlset(cityEntries));

  // 3. Tests — per-city list pages plus every city × test detail page.
  // `tests` above is already curated (real Tests + only `isCommonlyUsed`
  // shadow Tests) — nothing extra to filter here, but the two DO get split
  // by URL family: a shadow Test (a directly-bookable Parameter) is served
  // at `/parameter/{citySlug}/{slug}` and a real Test at
  // `/tests/{citySlug}/{slug}`, and each canonicalises to its own form (see
  // patient-web's `TestDetailPage`). Emitting a shadow Test under `/tests/`
  // here would advertise the non-canonical twin of a URL we already list.
  const realTests = tests.filter((t) => t.sourceParameterId === null);
  const parameterTests = tests.filter((t) => t.sourceParameterId !== null);

  const testEntries = [
    ...cities.map((c) => urlEntry(`${origin}/tests/${c.slug}`, { priority: "0.8" })),
    ...cities.flatMap((city) =>
      realTests.map((test) =>
        urlEntry(`${origin}/tests/${city.slug}/${test.slug}`, {
          lastmod: test.updatedAt.toISOString(),
          priority: "0.6",
        }),
      ),
    ),
  ];
  const testFiles = await writeChunked(outDir, "sitemap-tests", testEntries);

  // 3b. Parameters — the shadow Tests split out above, one page per
  // city × bookable analyte. Its own file (not merged into the Tests one)
  // so the per-file URL cap is spent per family and a crawl report reads
  // per family too.
  const parameterEntries = cities.flatMap((city) =>
    parameterTests.map((test) =>
      urlEntry(`${origin}/parameter/${city.slug}/${test.slug}`, {
        lastmod: test.updatedAt.toISOString(),
        priority: "0.5",
      }),
    ),
  );
  const parameterFiles = await writeChunked(outDir, "sitemap-parameters", parameterEntries);

  // 4. Packages — same shape as Tests.
  const packageEntries = [
    ...cities.map((c) => urlEntry(`${origin}/packages/${c.slug}`, { priority: "0.8" })),
    ...cities.flatMap((city) =>
      packages.map((pkg) =>
        urlEntry(`${origin}/packages/${city.slug}/${pkg.slug}`, {
          lastmod: pkg.updatedAt.toISOString(),
          priority: "0.7",
        }),
      ),
    ),
  ];
  const packageFiles = await writeChunked(outDir, "sitemap-packages", packageEntries);

  // 5. Index — references every file written above.
  const today = new Date().toISOString().slice(0, 10);
  const indexFilenames = [
    "sitemap-pages.xml",
    "sitemap-cities.xml",
    ...testFiles,
    ...parameterFiles,
    ...packageFiles,
  ];
  const indexEntries = indexFilenames.map(
    (filename) =>
      `  <sitemap>\n    <loc>${origin}/${filename}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`,
  );
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...indexEntries,
    "</sitemapindex>",
    "",
  ].join("\n");
  await fs.writeFile(path.join(outDir, "sitemap_index.xml"), indexXml);
  // Also served at the conventional `sitemap.xml` address, identical
  // content — an SEO audit flagged `sitemap.xml` 301-redirecting to
  // `sitemap_index.xml` as a problem in its own right (search engines
  // expect the URL they're given to resolve directly, not redirect), so
  // both filenames now exist as real files rather than one being an alias
  // of the other.
  await fs.writeFile(path.join(outDir, "sitemap.xml"), indexXml);

  // 6. robots.txt — points crawlers at the index, not any one category file.
  //    Disallows only the patient's own account/checkout pages — nothing on
  //    them is unique per-URL content worth indexing, and every one requires
  //    a login a crawler doesn't have anyway.
  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    "Disallow: /wallet",
    "Disallow: /orders",
    "Disallow: /addresses",
    "Disallow: /profile",
    "Disallow: /prescriptions",
    "Disallow: /cart",
    "Disallow: /login",
    "Disallow: /otp",
    "Disallow: /payment",
    "Disallow: /order-confirmation/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
  await fs.writeFile(path.join(outDir, "robots.txt"), robots);

  logger.info(
    `Sitemap regenerated: ${cities.length} cities, ${realTests.length} tests, ` +
      `${parameterTests.length} parameters, ${packages.length} packages ` +
      `(${indexFilenames.length} files).`,
  );
}

const DEBOUNCE_MS = 5_000;
let debounceTimer: NodeJS.Timeout | null = null;

/** Fire-and-forget, debounced wrapper — every call site (City/Test/Package
 *  create, update, status change) uses this, never `regenerateSitemap()`
 *  directly. Debounced because a CSV import or the `backfillShadowTests`
 *  script calls this once per row — hundreds of calls in the same second —
 *  and each one re-reads every active city/test/package from scratch; without
 *  coalescing, that's hundreds of redundant full rebuilds firing at once
 *  instead of one, after the burst settles. A rebuild failure only ever
 *  logs, never throws back into the admin action that triggered it. */
export function regenerateSitemapInBackground(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    regenerateSitemap().catch((error) => {
      logger.error("Sitemap regeneration failed", {
        error: error instanceof Error ? error.message : error,
      });
    });
  }, DEBOUNCE_MS);
}
