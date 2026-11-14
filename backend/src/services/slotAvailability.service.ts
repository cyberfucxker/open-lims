import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { getSlotAvailabilitySettings } from "./slotAvailabilitySettings.service";

export interface SlotAvailabilityResult {
  isBlocked: boolean;
  blockReason: string | null;
}

interface ResolveSlotAvailabilityInput {
  citySlotTemplateActive: boolean;
  holidayReason: string | null;
  areaId: string | null;
  areaBlockReason: string | null;
  slotBlockReason: string | null;
  activePhleboCount: number;
  bookedCount: number;
  withinLeadTime: boolean;
}

/** Home-collection slots close for booking this many hours before they
 *  start, giving dispatch enough time to assign a phlebotomist. Previously
 *  enforced only in the patient-web frontend (`slotLeadTime.ts`, since
 *  removed) — moved here so every client (web, and the app once it calls
 *  this same endpoint) gets slots pre-filtered instead of each one having to
 *  reimplement the cutoff itself.
 *
 *  Kept deliberately short: every slot template currently ends at 6 PM
 *  (latest starts 4 PM), so a long lead time wipes today's list out early in
 *  the afternoon — at 3 hours, today stopped being bookable from 1 PM
 *  onwards, which reads as a broken page rather than a policy. Raise this
 *  only alongside later evening templates. */
const MIN_BOOKING_LEAD_HOURS = 1;

// Fixed, no-DST offset — correct for every date this app will ever see. The
// server itself runs in UTC (confirmed on the EC2 host), but a slot
// template's `startTime` and the booking `date` are always IST wall-clock
// (the only country this app serves), so they're shifted by this amount
// rather than trusted to the process's own timezone.
const IST_OFFSET_MINUTES = 5 * 60 + 30;

/** True once a slot on `date` (yyyy-MM-dd) starting at `startTime` (HH:mm,
 *  24-hour, IST wall-clock) is within `MIN_BOOKING_LEAD_HOURS` of `now` —
 *  e.g. at 10:26 IST the 9–10 AM slot has already passed and the 10 AM–12 PM
 *  one doesn't leave a phlebotomist enough notice either, so the first
 *  bookable slot today starts at 11:26 or later. Always false for any date
 *  after today, since every slot on a future date starts well past the
 *  cutoff. */
function isWithinBookingLeadTime(date: string, startTime: string, now: Date = new Date()): boolean {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = startTime.split(":").map(Number);
  const slotStartUtcMs =
    Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60 * 1000;
  const cutoffMs = now.getTime() + MIN_BOOKING_LEAD_HOURS * 60 * 60 * 1000;
  return slotStartUtcMs < cutoffMs;
}

/** Per-step on/off switches — Superadmin's Slot Management > Settings tab,
 *  backed by `SlotAvailabilitySettings` (see its schema doc-comment). A
 *  `false` flag skips that waterfall step entirely (never blocks for that
 *  reason) rather than changing what it checks. */
export interface SlotAvailabilityToggles {
  checkCityConfigured: boolean;
  checkHoliday: boolean;
  checkAreaResolved: boolean;
  checkAreaBlock: boolean;
  checkSlotBlock: boolean;
  checkPhlebotomistCoverage: boolean;
  checkCapacity: boolean;
}

/** The priority waterfall: city configured? -> holiday? -> area resolved?
 *  -> area blocked? -> manually blocked? -> any active phlebotomist? ->
 *  capacity available? -> too close to start? -> available. Pure,
 *  synchronous, zero I/O — callers batch all the lookups (and the lead-time
 *  check, which only needs `Date.now()`) once per day/city rather than per
 *  template. Every step but the last only runs when its `toggles` flag is
 *  on — see `SlotAvailabilityToggles`'s doc-comment; the lead-time check is
 *  a hard wall-clock fact, not an admin policy, so it isn't toggle-gated. */
export function resolveSlotAvailability(
  input: ResolveSlotAvailabilityInput,
  toggles: SlotAvailabilityToggles,
): SlotAvailabilityResult {
  if (toggles.checkCityConfigured && !input.citySlotTemplateActive) {
    return { isBlocked: true, blockReason: "City not configured" };
  }
  if (toggles.checkHoliday && input.holidayReason) {
    return { isBlocked: true, blockReason: input.holidayReason };
  }
  if (toggles.checkAreaResolved && input.areaId === null) {
    return { isBlocked: true, blockReason: "Service not available in your area" };
  }
  if (toggles.checkAreaBlock && input.areaBlockReason) {
    return { isBlocked: true, blockReason: input.areaBlockReason };
  }
  if (toggles.checkSlotBlock && input.slotBlockReason) {
    return { isBlocked: true, blockReason: input.slotBlockReason };
  }
  if (toggles.checkPhlebotomistCoverage && input.activePhleboCount === 0) {
    return { isBlocked: true, blockReason: "No phlebotomist available" };
  }
  if (toggles.checkCapacity && input.bookedCount >= input.activePhleboCount) {
    return { isBlocked: true, blockReason: "Slot fully booked" };
  }
  if (input.withinLeadTime) {
    return {
      isBlocked: true,
      blockReason: `Booking closes ${MIN_BOOKING_LEAD_HOURS} ${
        MIN_BOOKING_LEAD_HOURS === 1 ? "hour" : "hours"
      } before the slot starts`,
    };
  }
  return { isBlocked: false, blockReason: null };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** A phlebotomist's working hours must fully CONTAIN a slot template's time
 *  range to count as coverage for it (stricter than "any overlap") —
 *  matches the literal meaning of "working hours." */
function phleboCoversTemplate(
  phlebo: { workingHoursStart: string | null; workingHoursEnd: string | null },
  template: { startTime: string; endTime: string },
): boolean {
  if (!phlebo.workingHoursStart || !phlebo.workingHoursEnd) return false;
  return (
    timeToMinutes(phlebo.workingHoursStart) <= timeToMinutes(template.startTime) &&
    timeToMinutes(phlebo.workingHoursEnd) >= timeToMinutes(template.endTime)
  );
}

export interface DaySlotResult {
  slotTemplateId: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  isBlocked: boolean;
  blockReason: string | null;
}

type Db = typeof prisma | Prisma.TransactionClient;

const NON_BOOKED_STATUSES = ["CANCELLED"] as const;

/** Batched computation for every template assigned to a city, on one date,
 *  scoped to one area (or `null` for an unresolved patient address, which
 *  always yields every slot blocked). Shared by the patient-facing
 *  slot-availability engine (`services/app/slot.service.ts`) and the admin
 *  Live Capacity view — one implementation, two callers, constant query
 *  count regardless of how many templates a city has. */
export async function getCityDaySlots(
  params: { cityId: string; areaId: string | null; date: string },
  db: Db = prisma,
): Promise<DaySlotResult[]> {
  const dateOnly = new Date(params.date);

  const [settings, assignments, holiday, areaBlocks, slotBlocks, areaPhlebos, bookedRows] =
    await Promise.all([
      getSlotAvailabilitySettings(),
      db.citySlotTemplate.findMany({
        where: { cityId: params.cityId, isActive: true },
        include: { slotTemplate: true },
      }),
      db.holiday.findFirst({ where: { cityId: params.cityId, holidayDate: dateOnly } }),
      params.areaId
        ? db.areaSlotBlock.findMany({ where: { areaId: params.areaId, blockDate: dateOnly } })
        : Promise.resolve([]),
      db.slotBlock.findMany({ where: { cityId: params.cityId, blockDate: dateOnly } }),
      params.areaId
        ? db.phlebotomist.findMany({
            where: { isActive: true, serviceAreas: { some: { areaId: params.areaId } } },
            select: { workingHoursStart: true, workingHoursEnd: true },
          })
        : Promise.resolve([]),
      params.areaId
        ? db.appOrder.groupBy({
            by: ["slotTemplateId"],
            where: {
              areaId: params.areaId,
              orderDate: dateOnly,
              status: { notIn: [...NON_BOOKED_STATUSES] },
              isDraft: false,
              slotTemplateId: { not: null },
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

  const areaBlockByTemplate = new Map(
    areaBlocks.map((b) => [b.slotTemplateId, b.reason ?? "Slot blocked in your area"]),
  );
  const slotBlockByTemplate = new Map(
    slotBlocks.map((b) => [b.slotTemplateId, b.reason ?? "Slot unavailable"]),
  );
  const bookedByTemplate = new Map(
    bookedRows.map((r) => [r.slotTemplateId as string, r._count._all]),
  );

  return assignments
    .map(({ slotTemplate }) => slotTemplate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((slotTemplate) => {
      const activePhleboCount = params.areaId
        ? areaPhlebos.filter((p) => phleboCoversTemplate(p, slotTemplate)).length
        : 0;
      const bookedCount = bookedByTemplate.get(slotTemplate.id) ?? 0;

      const result = resolveSlotAvailability(
        {
          citySlotTemplateActive: true,
          holidayReason: holiday?.reason ?? null,
          areaId: params.areaId,
          areaBlockReason: areaBlockByTemplate.get(slotTemplate.id) ?? null,
          slotBlockReason: slotBlockByTemplate.get(slotTemplate.id) ?? null,
          activePhleboCount,
          bookedCount,
          withinLeadTime: isWithinBookingLeadTime(params.date, slotTemplate.startTime),
        },
        settings,
      );

      return {
        slotTemplateId: slotTemplate.id,
        title: slotTemplate.title,
        startTime: slotTemplate.startTime,
        endTime: slotTemplate.endTime,
        capacity: activePhleboCount,
        booked: bookedCount,
        ...result,
      };
    });
}

/** Single-template check for Review Cart / Order Confirm — re-derives the
 *  same waterfall for exactly one slot template rather than every template
 *  assigned to the city, so it stays cheap to call inside a transaction. */
export async function checkSlotAvailability(
  params: { cityId: string; areaId: string | null; slotTemplateId: string; date: string },
  db: Db = prisma,
): Promise<SlotAvailabilityResult> {
  const dateOnly = new Date(params.date);

  const [settings, assignment, template] = await Promise.all([
    getSlotAvailabilitySettings(),
    db.citySlotTemplate.findFirst({
      where: { cityId: params.cityId, slotTemplateId: params.slotTemplateId, isActive: true },
    }),
    db.slotTemplate.findUnique({ where: { id: params.slotTemplateId } }),
  ]);

  if (!assignment || !template) {
    return { isBlocked: true, blockReason: "City not configured" };
  }

  const [holiday, areaBlock, slotBlock, areaPhlebos, bookedCount] = await Promise.all([
    db.holiday.findFirst({ where: { cityId: params.cityId, holidayDate: dateOnly } }),
    params.areaId
      ? db.areaSlotBlock.findFirst({
          where: {
            areaId: params.areaId,
            slotTemplateId: params.slotTemplateId,
            blockDate: dateOnly,
          },
        })
      : Promise.resolve(null),
    db.slotBlock.findFirst({
      where: { cityId: params.cityId, slotTemplateId: params.slotTemplateId, blockDate: dateOnly },
    }),
    params.areaId
      ? db.phlebotomist.findMany({
          where: { isActive: true, serviceAreas: { some: { areaId: params.areaId } } },
          select: { workingHoursStart: true, workingHoursEnd: true },
        })
      : Promise.resolve([]),
    params.areaId
      ? db.appOrder.count({
          where: {
            areaId: params.areaId,
            slotTemplateId: params.slotTemplateId,
            orderDate: dateOnly,
            status: { notIn: [...NON_BOOKED_STATUSES] },
            isDraft: false,
          },
        })
      : Promise.resolve(0),
  ]);

  const activePhleboCount = params.areaId
    ? areaPhlebos.filter((p) => phleboCoversTemplate(p, template)).length
    : 0;

  return resolveSlotAvailability(
    {
      citySlotTemplateActive: true,
      holidayReason: holiday?.reason ?? null,
      areaId: params.areaId,
      areaBlockReason: areaBlock ? (areaBlock.reason ?? "Slot blocked in your area") : null,
      slotBlockReason: slotBlock ? (slotBlock.reason ?? "Slot unavailable") : null,
      activePhleboCount,
      bookedCount,
      withinLeadTime: isWithinBookingLeadTime(params.date, template.startTime),
    },
    settings,
  );
}

export interface AddressSlotContext {
  cityId: string | null;
  areaId: string | null;
  useNewSlotSystem: boolean;
}

/** Resolves which city/area an Address belongs to, and whether that city
 *  has been cut over to the new Slot Template engine.
 *
 *  Order of resolution:
 *  1. The address's real `areaId` (set via the Address form's Area picker), if present.
 *  2. Match `address.pincode` against `Area.pincodes[]` **across every
 *     city** — deliberately NOT gated on first matching the address's
 *     free-text `city` string against `City.name` (an earlier version did
 *     that; a real, correctly-served pincode entered under a mistyped/
 *     misspelled city — "jaiur" instead of "Jaipur" — used to fail that
 *     name match and silently fall all the way through to the dead legacy
 *     `Slot` system, which shows zero slots for every date). A pincode
 *     already uniquely identifies real-world coverage on its own, so the
 *     city the matched Area belongs to is used as-is, regardless of what
 *     the patient typed into the City field. Covers every EXISTING address
 *     (created before the Area picker existed, or by an app version that
 *     hasn't shipped it yet) the same way city+pincode matching used to. On
 *     a match, the resolved area is persisted back onto the Address so this
 *     lookup only ever runs once per address, not on every request.
 *  3. If no Area anywhere matches the pincode (a genuinely out-of-coverage
 *     or garbled pincode — rare once (2) no longer needs the city name to
 *     agree first), fall back to whichever new-system city actually has
 *     slot templates live, with `areaId: null`. This keeps the "Area
 *     resolved" toggle in Superadmin's Slot Settings doing its one job:
 *     off (the default) still shows real, bookable slots rather than the
 *     dead legacy system; an admin who wants an unresolved address to
 *     correctly block instead turns that toggle on. */
export async function resolveAddressSlotContext(
  address: { id: string; areaId: string | null; pincode: string },
  db: Db = prisma,
): Promise<AddressSlotContext> {
  if (address.areaId) {
    const area = await db.area.findUnique({
      where: { id: address.areaId },
      select: { cityId: true, city: { select: { useNewSlotSystem: true } } },
    });
    if (area) {
      return {
        cityId: area.cityId,
        areaId: address.areaId,
        useNewSlotSystem: area.city.useNewSlotSystem,
      };
    }
  }

  const byPincode = await resolvePincodeSlotContext(address.pincode, db);
  if (byPincode.areaId) {
    await db.address.update({ where: { id: address.id }, data: { areaId: byPincode.areaId } });
  }
  return byPincode;
}

/** Steps 2–3 of `resolveAddressSlotContext` for a bare pincode, with no
 *  Address row to persist the match onto — the WhatsApp assistant checks
 *  serviceability and slots before the customer has an address on file.
 *  `areaId` is null exactly when no Area anywhere covers the pincode. */
export async function resolvePincodeSlotContext(
  pincode: string,
  db: Db = prisma,
): Promise<AddressSlotContext> {
  // A pincode can legitimately fall inside more than one `Area` row (see the
  // doc-comment on `Area.pincodes` — it's deliberately not unique), and,
  // now unscoped from any one city, could in principle match areas in more
  // than one city too (a pincode shared across city boundaries in the
  // source data). Picking whichever one Postgres happens to return first is
  // a real bug, not just a theoretical one: two areas can share a pincode
  // while only one of them has any phlebotomist actually covering it, and
  // landing on the phlebo-less one makes every slot show "No phlebotomist
  // available" even though the pincode genuinely has coverage. `orderBy`
  // alone would only make the wrong pick consistent — this instead prefers
  // whichever matching area has at least one active phlebotomist, falling
  // back to the oldest match if none do.
  const areasByPincode = await db.area.findMany({
    where: { isActive: true, pincodes: { has: pincode } },
    select: {
      id: true,
      cityId: true,
      city: { select: { useNewSlotSystem: true } },
      phlebotomistAreas: {
        where: { phlebotomist: { isActive: true } },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const areaByPincode =
    areasByPincode.find((area) => area.phlebotomistAreas.length > 0) ?? areasByPincode[0] ?? null;

  if (areaByPincode) {
    return {
      cityId: areaByPincode.cityId,
      areaId: areaByPincode.id,
      useNewSlotSystem: areaByPincode.city.useNewSlotSystem,
    };
  }

  // No Area anywhere covers this pincode — see case 3 in the doc-comment
  // above. Land on whichever new-system city actually has slot templates
  // assigned so `getCityDaySlots` still has something to show; `areaId`
  // stays null, so this only ever renders anything once the "Area
  // resolved" toggle is off (the default) — turning it on blocks these
  // exactly like every other unresolved address.
  const fallbackCity = await db.city.findFirst({
    where: { useNewSlotSystem: true, citySlotTemplates: { some: { isActive: true } } },
    orderBy: { name: "asc" },
    select: { id: true },
  });

  return { cityId: fallbackCity?.id ?? null, areaId: null, useNewSlotSystem: true };
}

/** Area-level `phlebotomyCharge` overrides the city's default when set;
 *  otherwise falls back to the city's rate (which itself defaults to 100 at
 *  the schema level) — used by Review Cart under the new Slot Template
 *  system, admin-editable from Superadmin's CMS "Phlebotomy Charges" tab. */
export async function resolvePhlebotomyCharge(
  cityId: string,
  areaId: string | null,
  db: Db = prisma,
): Promise<number> {
  const [city, area] = await Promise.all([
    db.city.findUnique({ where: { id: cityId }, select: { phlebotomyCharge: true } }),
    areaId
      ? db.area.findUnique({ where: { id: areaId }, select: { phlebotomyCharge: true } })
      : null,
  ]);

  if (area?.phlebotomyCharge != null) {
    return Number(area.phlebotomyCharge);
  }
  return Number(city?.phlebotomyCharge ?? 100);
}

/** Acquires a Postgres advisory transaction lock scoped to one
 *  area+slotTemplate+date, auto-released at transaction end — serializes
 *  concurrent Confirm Order attempts for the exact same slot, since
 *  "booked count" here is a live COUNT() over AppOrder rather than a single
 *  mutable counter column Postgres would otherwise serialize for us. */
export async function lockSlotForBooking(
  tx: Prisma.TransactionClient,
  params: { areaId: string; slotTemplateId: string; date: string },
): Promise<void> {
  const key = `${params.areaId}:${params.slotTemplateId}:${params.date}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}
