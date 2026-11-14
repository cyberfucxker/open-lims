import { prisma } from "../../../config/database";
import { resolveCityPriceListId } from "../../pricing.service";
import { loadCityOverrides } from "../../app/catalog.service";
import { resolveCartItems } from "../../app/cart.service";
import {
  getCityDaySlots,
  resolvePhlebotomyCharge,
  resolvePincodeSlotContext,
} from "../../slotAvailability.service";
import { ToolError, trackAmounts, type ToolContext } from "./context";

/** Read-only catalogue/availability tools. Prices come from
 *  `resolveCartItems` — the function checkout itself bills with — so a quote
 *  can never differ from what the booking charges. */

const MAX_RESULTS = 8;
/** Too generic to search on alone — "zzqx panel" must not return every panel. */
const GENERIC_WORDS = new Set([
  "test",
  "tests",
  "karwana",
  "karna",
  "karni",
  "hai",
  "check",
  "checkup",
  "the",
  "for",
  "and",
  "panel",
  "profile",
  "package",
  "packages",
  "blood",
  "level",
  "levels",
  "report",
  "mera",
  "mujhe",
]);
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export type ItemType = "TEST" | "PACKAGE";

function stripHtml(html: string | null | undefined, max = 160): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function fastingText(required: boolean, hours: number | null, prep?: string | null): string | null {
  const parts: string[] = [];
  if (required) parts.push(hours ? `${hours} hours fasting required` : "Fasting required");
  if (prep?.trim()) parts.push(prep.trim());
  return parts.length ? parts.join(". ") : null;
}

export function todayIst(now = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function to12Hour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function slotLabel(start: string, end: string): string {
  return `${to12Hour(start)} - ${to12Hour(end)}`;
}

// ─── Serviceability ────────────────────────────────────────────────────────

export interface PincodeArea {
  pincode: string;
  cityId: string;
  cityName: string;
  stateName: string;
  areaId: string;
  areaName: string;
  useNewSlotSystem: boolean;
}

/** Strict: a pincode is serviceable only when an active Area lists it. (The
 *  app's own fallback-city behaviour for unknown pincodes is deliberately not
 *  used here — over chat we would rather say "not yet" than book a home
 *  collection into the wrong city.) */
export async function resolvePincode(pincode: string): Promise<PincodeArea | null> {
  if (!/^\d{6}$/.test(pincode)) return null;
  const ctx = await resolvePincodeSlotContext(pincode);
  if (!ctx.areaId || !ctx.cityId) return null;
  const area = await prisma.area.findUnique({
    where: { id: ctx.areaId },
    include: { city: { include: { state: true } } },
  });
  if (!area || !area.city.isActive) return null;
  return {
    pincode,
    cityId: area.cityId,
    cityName: area.city.name,
    stateName: area.city.state.name,
    areaId: area.id,
    areaName: area.name,
    useNewSlotSystem: area.city.useNewSlotSystem,
  };
}

async function servedCityNames(): Promise<string[]> {
  const cities = await prisma.city.findMany({
    where: { isActive: true, areas: { some: { isActive: true } } },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return cities.map((c) => c.name);
}

export async function checkServiceability(ctx: ToolContext, input: { city_or_pincode: string }) {
  const query = String(input.city_or_pincode ?? "").trim();
  if (/^\d{6}$/.test(query)) {
    const area = await resolvePincode(query);
    if (area) {
      const charge = await resolvePhlebotomyCharge(area.cityId, area.areaId);
      trackAmounts(ctx.turn, charge);
      return {
        serviceable: true,
        pincode: query,
        city: area.cityName,
        area: area.areaName,
        home_collection_charge: charge,
      };
    }
    return { serviceable: false, pincode: query, served_cities: await servedCityNames() };
  }

  const city = await prisma.city.findFirst({
    where: {
      name: { equals: query, mode: "insensitive" },
      isActive: true,
      areas: { some: { isActive: true } },
    },
  });
  if (city) {
    return {
      serviceable: true,
      city: city.name,
      note: "City is served. Ask for the 6-digit pincode to confirm the exact area before showing slots.",
    };
  }
  return { serviceable: false, query, served_cities: await servedCityNames() };
}

// ─── Catalogue search ──────────────────────────────────────────────────────

async function offeredFilter(pincode: string | undefined) {
  const area = pincode ? await resolvePincode(pincode) : null;
  const priceListId = area ? await resolveCityPriceListId(area.cityId) : null;
  const [tests, packages] = await Promise.all([
    loadCityOverrides(priceListId, "TEST"),
    loadCityOverrides(priceListId, "PACKAGE"),
  ]);
  return (type: ItemType, id: string) =>
    (type === "TEST" ? tests : packages).get(id)?.isOffered !== false;
}

/** Compact, model-facing description of catalogue items, priced exactly as
 *  checkout prices them. Unknown/inactive ids are dropped. */
export async function describeItems(
  ctx: ToolContext,
  refs: Array<{ type: ItemType; id: string }>,
  pincode?: string,
) {
  const testIds = refs.filter((r) => r.type === "TEST").map((r) => r.id);
  const packageIds = refs.filter((r) => r.type === "PACKAGE").map((r) => r.id);
  const [tests, packages, isOffered] = await Promise.all([
    prisma.test.findMany({
      where: { id: { in: testIds }, status: "Active" },
      include: { sampleType: true, sampleRule: true },
    }),
    prisma.package.findMany({
      where: { id: { in: packageIds }, active: true, deletedAt: null, packageTests: { some: {} } },
      include: {
        sampleType: true,
        packageTests: { include: { test: { select: { name: true } } } },
      },
    }),
    offeredFilter(pincode),
  ]);
  const prices = new Map(
    (
      await resolveCartItems(
        refs.map((r) => ({ id: `${r.type}:${r.id}`, itemType: r.type, itemId: r.id })),
      )
    ).map((p) => [p.id, p]),
  );

  const out: Array<Record<string, unknown>> = [];
  for (const ref of refs) {
    if (!isOffered(ref.type, ref.id)) continue;
    const price = prices.get(`${ref.type}:${ref.id}`);
    if (!price) continue;
    if (ref.type === "TEST") {
      const t = tests.find((x) => x.id === ref.id);
      if (!t) continue;
      out.push({
        type: "TEST",
        id: t.id,
        name: t.name,
        code: t.shortName,
        price: price.salePrice,
        mrp: price.mrp,
        sample: t.sampleType.name,
        fasting: fastingText(
          t.isFastingRequired || !!t.sampleRule?.requiresFasting,
          t.fastingHours ?? t.sampleRule?.fastingHours ?? null,
          t.sampleRule?.preparationInstructions,
        ),
        report_time: t.reportTime,
        recommended_for: t.recommendedFor === "BOTH" ? null : t.recommendedFor.toLowerCase(),
        about: stripHtml(t.description),
      });
    } else {
      const p = packages.find((x) => x.id === ref.id);
      if (!p) continue;
      const names = p.packageTests.map((pt) => pt.test.name);
      out.push({
        type: "PACKAGE",
        id: p.id,
        name: p.name,
        price: price.salePrice,
        mrp: price.mrp,
        sample: p.sampleType?.name ?? null,
        fasting: fastingText(p.isFastingRequired, p.fastingHours),
        report_time: p.reportTime,
        recommended_for: p.recommendedFor === "BOTH" ? null : p.recommendedFor.toLowerCase(),
        includes: names.slice(0, 12),
        includes_more: Math.max(names.length - 12, 0),
        about: stripHtml(p.description),
      });
    }
    trackAmounts(ctx.turn, price.salePrice, price.mrp);
    ctx.turn.optionIds.add(`${ref.type === "TEST" ? "test" : "pkg"}:${ref.id}`);
  }
  return out;
}

async function findItemIds(term: string): Promise<Array<{ type: ItemType; id: string }>> {
  const contains = { contains: term, mode: "insensitive" as const };
  const [tests, packages] = await Promise.all([
    prisma.test.findMany({
      where: { status: "Active", OR: [{ name: contains }, { shortName: contains }] },
      select: { id: true, bookedCount: true, sourceParameterId: true },
      orderBy: [{ bookedCount: "desc" }, { name: "asc" }],
      take: 20,
    }),
    prisma.package.findMany({
      where: { active: true, deletedAt: null, name: contains, packageTests: { some: {} } },
      select: { id: true },
      orderBy: [{ bookedCount: "desc" }, { name: "asc" }],
      take: 10,
    }),
  ]);
  // Hand-made Tests before auto-provisioned single-parameter shadows.
  tests.sort((a, b) => Number(a.sourceParameterId !== null) - Number(b.sourceParameterId !== null));
  return [
    ...packages.map((p) => ({ type: "PACKAGE" as const, id: p.id })),
    ...tests.map((t) => ({ type: "TEST" as const, id: t.id })),
  ];
}

export async function searchCatalogue(
  ctx: ToolContext,
  input: { query: string; pincode?: string },
) {
  const query = String(input.query ?? "")
    .trim()
    .slice(0, 80);
  if (query.length < 2) throw new ToolError("query is too short");

  let refs = await findItemIds(query);
  if (refs.length === 0) {
    // "thyroid test karwana hai" → try each meaningful word.
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !GENERIC_WORDS.has(w));
    for (const word of words) {
      refs = await findItemIds(word);
      if (refs.length) break;
    }
  }
  const items = await describeItems(ctx, refs.slice(0, MAX_RESULTS * 2), input.pincode);
  return {
    query,
    results: items.slice(0, MAX_RESULTS),
    ...(items.length === 0
      ? {
          note: "Nothing in our catalogue matches. Do not suggest any test from general knowledge.",
        }
      : {}),
  };
}

// ─── Concern mapping (the ONLY source for symptom-based suggestions) ───────

export async function suggestForConcern(
  ctx: ToolContext,
  input: { concern: string; pincode?: string },
) {
  const text = String(input.concern ?? "").toLowerCase();
  const mappings = await prisma.concernTestMapping.findMany({ where: { isActive: true } });
  const scored = mappings
    .map((m) => {
      const terms = [m.concern.toLowerCase(), ...m.keywords];
      return { m, score: terms.filter((k) => k && text.includes(k)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length === 0) {
    return {
      matched: false,
      instruction:
        "No curated suggestion exists for this concern. Do NOT name any test. Offer (1) a Home Visit, " +
        "where our phlebotomist visits and the tests are decided with the doctor's advice, or (2) talking to our team.",
    };
  }

  const suggestions = [];
  for (const { m } of scored) {
    const items = await describeItems(
      ctx,
      [
        ...m.packageIds.map((id) => ({ type: "PACKAGE" as const, id })),
        ...m.testIds.map((id) => ({ type: "TEST" as const, id })),
      ],
      input.pincode,
    );
    if (items.length) suggestions.push({ concern: m.concern, notes: m.notes, items });
  }
  return suggestions.length
    ? {
        matched: true,
        suggestions,
        disclaimer:
          "These are tests doctors commonly suggest for such symptoms — not a diagnosis. The final decision is the doctor's.",
      }
    : {
        matched: false,
        instruction: "Mapped tests are not available here. Offer a Home Visit or our team.",
      };
}

// ─── Slots ─────────────────────────────────────────────────────────────────

export function assertBookableDate(date: string, now = new Date()): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    throw new ToolError("date must be YYYY-MM-DD");
  }
  const today = todayIst(now);
  if (date < today) throw new ToolError("That date is in the past.");
  const max = todayIst(new Date(now.getTime() + 30 * 86400000));
  if (date > max) throw new ToolError("Bookings open only 30 days ahead.");
}

export interface OpenSlot {
  slot_id: string;
  time: string;
  remaining: number | null;
}

/** Open slots for a pincode+date — the same engines the app's Slot
 *  Availability endpoint uses (Slot Templates for cut-over cities, legacy
 *  `Slot` rows otherwise). */
export async function listOpenSlots(area: PincodeArea, date: string): Promise<OpenSlot[]> {
  if (area.useNewSlotSystem) {
    const slots = await getCityDaySlots({ cityId: area.cityId, areaId: area.areaId, date });
    return slots
      .filter((s) => !s.isBlocked)
      .map((s) => ({
        slot_id: s.slotTemplateId,
        time: slotLabel(s.startTime, s.endTime),
        remaining: Math.max(s.capacity - s.booked, 0),
      }));
  }
  const legacy = await prisma.slot.findMany({
    where: { centerId: null, slotDate: new Date(date) },
    orderBy: { startTime: "asc" },
  });
  return legacy
    .filter((s) => !s.isBlocked && s.bookedCount < s.capacity)
    .map((s) => ({
      slot_id: s.id,
      time: slotLabel(s.startTime, s.endTime),
      remaining: s.capacity - s.bookedCount,
    }));
}

export async function getSlots(ctx: ToolContext, input: { pincode: string; date: string }) {
  assertBookableDate(input.date);
  const area = await resolvePincode(String(input.pincode ?? ""));
  if (!area) {
    return { serviceable: false, served_cities: await servedCityNames() };
  }
  const open = await listOpenSlots(area, input.date);
  for (const s of open) ctx.turn.optionIds.add(`slot:${s.slot_id}`);
  return {
    date: input.date,
    city: area.cityName,
    area: area.areaName,
    slots: open.slice(0, 10),
    ...(open.length === 0 ? { note: "No slot is open on this date. Offer another date." } : {}),
  };
}

// ─── Price quote ───────────────────────────────────────────────────────────

export interface QuoteItem {
  type: ItemType;
  id: string;
}

export interface Quote {
  lines: Array<{ type: ItemType; id: string; name: string; price: number; mrp: number }>;
  subtotal: number;
  homeCollectionCharge: number;
  total: number;
}

/** The authoritative price: item prices from `resolveCartItems`, the
 *  home-collection charge from `resolvePhlebotomyCharge` (or the legacy
 *  slot's surcharge). No wallet, no coupon — WhatsApp bookings are
 *  Cash on Collection, exactly what `createDirectCashBooking` charges. */
export async function computeQuote(
  items: QuoteItem[],
  area: PincodeArea,
  slotId?: string | null,
): Promise<Quote> {
  if (items.length === 0) throw new ToolError("No tests selected");
  const isOffered = await offeredFilter(area.pincode);
  const unoffered = items.find((i) => !isOffered(i.type, i.id));
  if (unoffered) throw new ToolError(`Item ${unoffered.id} is not offered in ${area.cityName}`);

  const resolved = await resolveCartItems(
    items.map((i, n) => ({ id: String(n), itemType: i.type, itemId: i.id })),
  );
  if (resolved.length !== items.length) {
    throw new ToolError(
      "One or more selected items are not available. Search the catalogue again.",
    );
  }
  // `resolveCartItems` prices a row even when it is inactive — re-check
  // bookability the way `catalog.service.ts#addToCart` does.
  const [activeTests, activePackages] = await Promise.all([
    prisma.test.count({
      where: {
        id: { in: items.filter((i) => i.type === "TEST").map((i) => i.id) },
        status: "Active",
      },
    }),
    prisma.package.count({
      where: {
        id: { in: items.filter((i) => i.type === "PACKAGE").map((i) => i.id) },
        active: true,
        deletedAt: null,
        packageTests: { some: {} },
      },
    }),
  ]);
  const distinct = (t: ItemType) =>
    new Set(items.filter((i) => i.type === t).map((i) => i.id)).size;
  if (activeTests !== distinct("TEST") || activePackages !== distinct("PACKAGE")) {
    throw new ToolError("One or more selected items are not available for booking.");
  }

  let homeCollectionCharge: number;
  if (area.useNewSlotSystem) {
    homeCollectionCharge = await resolvePhlebotomyCharge(area.cityId, area.areaId);
  } else {
    const slot = slotId ? await prisma.slot.findUnique({ where: { id: slotId } }) : null;
    homeCollectionCharge = slot ? Number(slot.surchargeAmount) : 0;
  }
  const lines = resolved.map((r, n) => ({
    type: items[n].type,
    id: items[n].id,
    name: r.testName,
    price: r.salePrice,
    mrp: r.mrp,
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.price, 0);
  return { lines, subtotal, homeCollectionCharge, total: subtotal + homeCollectionCharge };
}

export async function getPriceQuote(
  ctx: ToolContext,
  input: { items: QuoteItem[]; pincode: string; patient_count?: number },
) {
  const area = await resolvePincode(String(input.pincode ?? ""));
  if (!area) return { serviceable: false, served_cities: await servedCityNames() };
  const count = Math.min(Math.max(Math.floor(input.patient_count ?? 1), 1), 6);
  const perPatient = await computeQuote(input.items ?? [], area);
  const quote = {
    items: perPatient.lines.map((l) => ({ name: l.name, price: l.price, mrp: l.mrp })),
    patients: count,
    tests_total: perPatient.subtotal * count,
    home_collection_charge: perPatient.homeCollectionCharge,
    total_payable: perPatient.subtotal * count + perPatient.homeCollectionCharge,
    payment: "Cash on collection",
    ...(area.useNewSlotSystem
      ? {}
      : { note: "Home collection charge depends on the slot chosen." }),
  };
  trackAmounts(
    ctx.turn,
    ...perPatient.lines.flatMap((l) => [l.price, l.mrp]),
    quote.tests_total,
    quote.home_collection_charge,
    quote.total_payable,
  );
  return quote;
}
