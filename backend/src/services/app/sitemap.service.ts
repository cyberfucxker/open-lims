import { prisma } from "../../config/database";

export interface SitemapData {
  cities: Array<{ slug: string }>;
  /** `isParameter` splits the two URL families a consumer must build:
   *  `/tests/{citySlug}/{slug}` for a real Test, `/parameter/{citySlug}/{slug}`
   *  for the shadow Test behind a directly-bookable Parameter (see
   *  `Test.sourceParameterId`). Only one of the two is canonical per row —
   *  the app redirects the other — so emitting both would list a URL that
   *  bounces. */
  tests: Array<{ slug: string; updatedAt: string; isParameter: boolean }>;
  packages: Array<{ slug: string; updatedAt: string }>;
}

/** Feeds patient-web's build-time sitemap generator
 *  (`frontend/patient-web/scripts/generate-sitemap.mjs`) — every active city
 *  crossed with every active test/package is a real, crawlable URL
 *  (`/{citySlug}/tests/{testSlug}`), so this is the full list of what belongs
 *  in sitemap.xml. Slugs and timestamps only — no pricing or personal data,
 *  this isn't a catalogue endpoint. */
export async function getSitemapData(): Promise<SitemapData> {
  const [cities, tests, packages] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.test.findMany({
      where: { status: "Active" },
      select: { slug: true, updatedAt: true, sourceParameterId: true },
    }),
    prisma.package.findMany({
      where: { active: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return {
    cities: cities.map((c) => ({ slug: c.slug })),
    tests: tests.map((t) => ({
      slug: t.slug,
      updatedAt: t.updatedAt.toISOString(),
      isParameter: t.sourceParameterId !== null,
    })),
    packages: packages.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt.toISOString() })),
  };
}
