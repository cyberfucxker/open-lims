/**
 * Ad landing pages against a THROWAWAY database copy (same
 * WHATSAPP_TEST_DATABASE_URL as the WhatsApp integration tests).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RUN = !!process.env.WHATSAPP_TEST_DATABASE_URL;

describe.skipIf(!RUN)("Landing pages", async () => {
  const { prisma } = await import("../src/config/database");
  const svc = await import("../src/services/landingPage.service");
  const { listPackages } = await import("../src/services/app/catalog.service");

  let cityId: string;
  let packageIds: string[];
  const created: string[] = [];
  const day = 86400000;
  const input = (over: Partial<Parameters<typeof svc.createLandingPage>[0]> = {}) => ({
    name: `Test Offer ${Math.random().toString(36).slice(2, 7)}`,
    title: "Full body checkup at home",
    cityId,
    packageIds,
    desktopBannerUrl: "/uploads/banner-d.jpg",
    mobileBannerUrl: "/uploads/banner-m.jpg",
    validFrom: new Date(Date.now() - day).toISOString(),
    validTo: new Date(Date.now() + 30 * day).toISOString(),
    ...over,
  });

  beforeAll(async () => {
    cityId = (await prisma.city.findFirstOrThrow({ where: { isActive: true } })).id;
    packageIds = (
      await prisma.package.findMany({
        where: { active: true, deletedAt: null, packageTests: { some: {} } },
        orderBy: { price: "desc" },
        take: 2,
      })
    ).map((p) => p.id);
  });

  afterAll(async () => {
    await prisma.landingPage.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("creates a page with a slug from the name and keeps the package order", async () => {
    const page = await svc.createLandingPage(input({ name: "Jaipur Diwali Offer!" }));
    created.push(page.id);
    expect(page.slug).toBe("jaipur-diwali-offer");
    expect(page.packages.map((p) => p.id)).toEqual(packageIds);
    expect(page.state).toBe("LIVE");
    await expect(svc.createLandingPage(input({ slug: "jaipur-diwali-offer" }))).rejects.toThrow(
      /already used/,
    );
  });

  it("validates dates, packages and city", async () => {
    await expect(
      svc.createLandingPage(input({ validTo: new Date(Date.now() - 2 * day).toISOString() })),
    ).rejects.toThrow(/end date/);
    await expect(svc.createLandingPage(input({ packageIds: [] }))).rejects.toThrow(/package/);
    await expect(
      svc.createLandingPage(input({ cityId: "11111111-1111-4111-8111-111111111111" })),
    ).rejects.toThrow(/city/);
  });

  it("serves LIVE pages with exactly the website's prices for that city", async () => {
    const page = await svc.createLandingPage(input());
    created.push(page.id);
    const pub = await svc.getPublicLandingPage(page.slug, null);
    expect(pub.state).toBe("LIVE");
    const catalogue = await listPackages(null, cityId, null, { page: 1, pageSize: 1000 });
    for (const p of pub.packages) {
      const site = catalogue.items.find((c) => c.id === p.id)!;
      expect(p.offer_price).toBe(site.offer_price);
      expect(p.actual_price).toBe(site.actual_price);
    }
    expect(pub.packages.map((p) => p.id)).toEqual(packageIds);
  });

  it("hides packages when the offer is upcoming, expired or switched off", async () => {
    const upcoming = await svc.createLandingPage(
      input({
        validFrom: new Date(Date.now() + day).toISOString(),
        validTo: new Date(Date.now() + 5 * day).toISOString(),
      }),
    );
    const expired = await svc.createLandingPage(
      input({
        validFrom: new Date(Date.now() - 5 * day).toISOString(),
        validTo: new Date(Date.now() - day).toISOString(),
      }),
    );
    const off = await svc.createLandingPage(input({ isActive: false }));
    created.push(upcoming.id, expired.id, off.id);
    for (const [page, state] of [
      [upcoming, "UPCOMING"],
      [expired, "EXPIRED"],
      [off, "OFF"],
    ] as const) {
      const pub = await svc.getPublicLandingPage(page.slug, null);
      expect(pub.state).toBe(state);
      expect(pub.packages).toEqual([]);
    }
    await expect(svc.getPublicLandingPage("no-such-offer", null)).rejects.toThrow(/not found/);
  });

  it("updates in place and toggles status", async () => {
    const page = await svc.createLandingPage(input());
    created.push(page.id);
    const updated = await svc.updateLandingPage(
      page.id,
      input({
        name: page.name,
        slug: page.slug,
        packageIds: [...packageIds].reverse(),
        title: "New title",
      }),
    );
    expect(updated.title).toBe("New title");
    expect(updated.packages.map((p) => p.id)).toEqual([...packageIds].reverse());
    expect((await svc.setLandingPageStatus(page.id, false)).state).toBe("OFF");
  });
});
