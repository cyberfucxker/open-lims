import { createHash, randomUUID } from "crypto";
import type { FamilyMemberRelation, Prisma, WhatsappBookingDraft } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import type { Gender } from "../../types/patient.types";
import { createLinkedPatient } from "../app/patientLink.service";
import { addAddress } from "../app/address.service";
import { createDirectCashBooking } from "../app/order.service";
import { resolvePhlebotomyCharge } from "../slotAvailability.service";
import { createHomeVisitBooking } from "../app/homeVisit.service";
import {
  assertBookableDate,
  computeQuote,
  describeItems,
  listOpenSlots,
  resolvePincode,
  type PincodeArea,
  type QuoteItem,
} from "./tools/catalogue.tools";
import { ToolError, trackAmounts, type ToolContext } from "./tools/context";

/**
 * WhatsApp booking drafts → real bookings.
 *
 * A draft is the single source of truth for what the customer confirms: the
 * summary text is built from it by code (never by the model), its hash rides
 * in the Confirm button id, and confirmation books from the stored row — not
 * from anything the model says at that moment.
 */

export const DRAFT_TTL_MS = 30 * 60 * 1000;

export interface DraftPatient {
  familyMemberId: string | null;
  name: string;
  gender: Gender;
  /** YYYY-MM-DD */
  dob: string;
  dobApproximate: boolean;
  relation: FamilyMemberRelation;
}

export interface DraftPayload {
  kind: "CATALOG" | "HOME_VISIT";
  patient: DraftPatient;
  items: Array<QuoteItem & { name: string; price: number }>;
  symptomNotes: string | null;
  address: {
    line: string;
    houseNo: string | null;
    locality: string | null;
    landmark: string | null;
    pincode: string;
    city: string;
    state: string;
    lat: string | null;
    lng: string | null;
  };
  date: string;
  slotId: string;
  slotTime: string;
  quote: { subtotal: number; homeCollectionCharge: number; total: number };
  fasting: string[];
}

export function patientName(p: { firstName: string; lastName: string | null }): string {
  return `${p.firstName} ${p.lastName ?? ""}`.trim();
}

function rupees(n: number): string {
  return `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function displayDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ageFromDob(dob: string): number {
  const birth = new Date(`${dob}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

/** The exact text the customer confirms. Deterministic from the payload. */
export function buildSummary(p: DraftPayload): string {
  const lines = [
    "*Booking summary*",
    `👤 ${p.patient.name}, ${ageFromDob(p.patient.dob)} yrs, ${p.patient.gender}`,
  ];
  if (p.kind === "HOME_VISIT") {
    lines.push(
      "🩺 Home Visit — our phlebotomist decides the tests with you (as per your doctor's advice)",
    );
  } else {
    for (const item of p.items) lines.push(`🧪 ${item.name} — ${rupees(item.price)}`);
  }
  const addr = [p.address.houseNo, p.address.line, p.address.locality, p.address.landmark]
    .filter(Boolean)
    .join(", ");
  lines.push(`🏠 ${addr}, ${p.address.city} - ${p.address.pincode}`);
  lines.push(`📅 ${displayDate(p.date)}, ${p.slotTime}`);
  if (p.kind === "HOME_VISIT") {
    lines.push(
      `💰 Home visit charge: ${rupees(p.quote.homeCollectionCharge)} (tests are priced at the visit)`,
    );
  } else {
    if (p.quote.homeCollectionCharge > 0) {
      lines.push(`🚗 Home collection: ${rupees(p.quote.homeCollectionCharge)}`);
    }
    lines.push(`💰 *Total: ${rupees(p.quote.total)}*`);
  }
  lines.push("💵 Payment: Cash on collection");
  if (p.fasting.length) lines.push(`⚠️ ${p.fasting.join(" ")}`);
  lines.push("", "Confirm karein?");
  return lines.join("\n");
}

export function summaryHash(draftId: string, summary: string): string {
  return createHash("sha256").update(`${draftId}\n${summary}`).digest("hex");
}

/** Confirm-button id: `wa_confirm:<draftId>:<first 16 hex of the hash>` —
 *  well under Meta's 256-char limit, and enough to detect a changed summary. */
export function confirmButtonId(draftId: string, hash: string): string {
  return `wa_confirm:${draftId}:${hash.slice(0, 16)}`;
}

export function parseConfirmButtonId(id: string): { draftId: string; hashPrefix: string } | null {
  const m = /^wa_confirm:([0-9a-f-]{36}):([0-9a-f]{16})$/.exec(id);
  return m ? { draftId: m[1], hashPrefix: m[2] } : null;
}

// ─── save_booking_draft ────────────────────────────────────────────────────

export interface SaveDraftInput {
  kind?: "catalog" | "home_visit";
  items?: QuoteItem[];
  symptom_notes?: string;
  patient: {
    family_member_id?: string;
    name?: string;
    gender?: string;
    dob?: string;
    age?: number;
    relation?: string;
  };
  address: {
    house_no?: string;
    address_line: string;
    locality?: string;
    landmark?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  date: string;
  slot_id: string;
}

const RELATIONS: FamilyMemberRelation[] = [
  "SELF",
  "FATHER",
  "MOTHER",
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "BROTHER",
  "SISTER",
  "OTHER",
];

function toGender(value: string | undefined): Gender {
  const v = (value ?? "").trim().toLowerCase();
  if (["male", "m", "man", "boy", "purush", "ladka"].includes(v)) return "Male";
  if (["female", "f", "woman", "girl", "mahila", "ladki", "stri"].includes(v)) return "Female";
  if (["other", "o"].includes(v)) return "Other";
  throw new ToolError("gender must be male, female or other — ask the customer");
}

async function resolvePatient(
  ctx: ToolContext,
  input: SaveDraftInput["patient"],
): Promise<DraftPatient> {
  if (input.family_member_id) {
    const member = ctx.phone
      ? await prisma.familyMember.findFirst({
          where: { id: input.family_member_id, appUser: { mobile: ctx.phone } },
          include: { patient: true },
        })
      : null;
    if (!member) throw new ToolError("family_member_id not found for this customer");
    return {
      familyMemberId: member.id,
      name: patientName(member.patient),
      gender: member.patient.gender as Gender,
      dob: member.patient.dob.toISOString().slice(0, 10),
      dobApproximate: false,
      relation: member.relation,
    };
  }

  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100) throw new ToolError("patient name is required");
  const gender = toGender(input.gender);

  let dob: string;
  let dobApproximate = false;
  if (input.dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dob) || Number.isNaN(Date.parse(input.dob))) {
      throw new ToolError("dob must be YYYY-MM-DD");
    }
    dob = input.dob;
  } else if (typeof input.age === "number" && input.age >= 0 && input.age <= 120) {
    // Same convention as familyMember.service's age-only entry: Jan 1 of the
    // implied birth year.
    dob = `${new Date().getUTCFullYear() - Math.floor(input.age)}-01-01`;
    dobApproximate = true;
  } else {
    throw new ToolError("patient date of birth (or age) is required");
  }
  const age = ageFromDob(dob);
  if (age < 0 || age > 120) throw new ToolError("date of birth looks wrong — ask again");

  const relation = (input.relation ?? "other").toUpperCase() as FamilyMemberRelation;
  return {
    familyMemberId: null,
    name,
    gender,
    dob,
    dobApproximate,
    relation: RELATIONS.includes(relation) ? relation : "OTHER",
  };
}

export interface DraftView {
  draftId: string;
  summary: string;
  hash: string;
  payload: DraftPayload;
}

export async function saveDraft(ctx: ToolContext, input: SaveDraftInput): Promise<DraftView> {
  const kind = input.kind === "home_visit" ? "HOME_VISIT" : "CATALOG";
  assertBookableDate(input.date);

  const area = await resolvePincode(String(input.address?.pincode ?? ""));
  if (!area) throw new ToolError("This pincode is not serviceable — check serviceability first");

  const line = (input.address.address_line ?? "").trim();
  if (line.length < 5) throw new ToolError("full address (street/colony) is required");

  const open = await listOpenSlots(area, input.date);
  const slot = open.find((s) => s.slot_id === input.slot_id);
  if (!slot)
    throw new ToolError(
      "That slot is not available — call get_slots again and offer the open ones",
    );

  const patient = await resolvePatient(ctx, input.patient ?? {});

  let items: DraftPayload["items"] = [];
  let quote: DraftPayload["quote"];
  let fasting: string[] = [];
  if (kind === "CATALOG") {
    const refs = (input.items ?? []).filter(
      (i) => i && (i.type === "TEST" || i.type === "PACKAGE"),
    );
    if (refs.length === 0) throw new ToolError("items are required (ids from search results)");
    const computed = await computeQuote(refs, area, slot.slot_id);
    items = computed.lines.map((l) => ({ type: l.type, id: l.id, name: l.name, price: l.price }));
    quote = {
      subtotal: computed.subtotal,
      homeCollectionCharge: computed.homeCollectionCharge,
      total: computed.total,
    };
    const described = await describeItems(ctx, refs, area.pincode);
    fasting = [...new Set(described.map((d) => d.fasting).filter((f): f is string => !!f))];
  } else {
    const notes = (input.symptom_notes ?? "").trim();
    if (notes.length < 3) throw new ToolError("symptom_notes are required for a home visit");
    const computed = await computeHomeVisitCharge(area, slot.slot_id);
    quote = { subtotal: 0, homeCollectionCharge: computed, total: computed };
  }

  const payload: DraftPayload = {
    kind,
    patient,
    items,
    symptomNotes: kind === "HOME_VISIT" ? (input.symptom_notes ?? "").trim().slice(0, 500) : null,
    address: {
      line: line.slice(0, 250),
      houseNo: input.address.house_no?.trim().slice(0, 100) || null,
      locality: input.address.locality?.trim().slice(0, 150) || null,
      landmark: input.address.landmark?.trim().slice(0, 150) || null,
      pincode: area.pincode,
      city: area.cityName,
      state: area.stateName,
      lat: input.address.latitude != null ? String(input.address.latitude) : null,
      lng: input.address.longitude != null ? String(input.address.longitude) : null,
    },
    date: input.date,
    slotId: slot.slot_id,
    slotTime: slot.time,
    quote,
    fasting,
  };
  trackAmounts(
    ctx.turn,
    quote.subtotal,
    quote.homeCollectionCharge,
    quote.total,
    ...items.map((i) => i.price),
  );

  const draftId = randomUUID();
  const summary = buildSummary(payload);
  const hash = summaryHash(draftId, summary);

  if (!ctx.dryRun && ctx.conversationId) {
    await prisma.$transaction([
      // One live draft per chat — an older one can no longer be confirmed.
      prisma.whatsappBookingDraft.updateMany({
        where: { conversationId: ctx.conversationId, status: "DRAFT" },
        data: { status: "EXPIRED" },
      }),
      prisma.whatsappBookingDraft.create({
        data: {
          id: draftId,
          conversationId: ctx.conversationId,
          payload: payload as unknown as Prisma.InputJsonValue,
          summaryHash: hash,
          expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
        },
      }),
    ]);
  }
  ctx.turn.summary = { draftId, text: summary, hash };
  return { draftId, summary, hash, payload };
}

async function computeHomeVisitCharge(area: PincodeArea, slotId: string): Promise<number> {
  // Same charge `createHomeVisitBooking` stores: area/city phlebotomy charge
  // under Slot Templates, the legacy slot's surcharge otherwise.
  if (area.useNewSlotSystem) return resolvePhlebotomyCharge(area.cityId, area.areaId);
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  return slot ? Number(slot.surchargeAmount) : 0;
}

// ─── Account / patient / address — the same rows the app would create ─────

/** The sender's AppUser, created on first booking. The number is verified by
 *  Meta (it is the WhatsApp sender), which is the same proof an OTP login
 *  gives — `verifyLoginOtp` upserts the same way. */
export async function ensureAppUser(phone: string, conversationId: string | null) {
  const appUser = await prisma.appUser.upsert({
    where: { mobile: phone },
    update: {},
    create: { mobile: phone, platform: "WHATSAPP" },
  });
  if (conversationId) {
    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { appUserId: appUser.id },
    });
  }
  return appUser;
}

async function ensureFamilyMember(
  appUserId: string,
  mobile: string,
  patient: DraftPatient,
): Promise<string> {
  if (patient.familyMemberId) {
    const owned = await prisma.familyMember.findFirst({
      where: { id: patient.familyMemberId, appUserId },
      select: { id: true },
    });
    if (!owned) throw ApiError.notFound("Family member not found");
    return owned.id;
  }

  // Reuse an existing member with the same name and date of birth rather
  // than creating a duplicate patient on every chat booking.
  const existing = await prisma.familyMember.findMany({
    where: { appUserId },
    include: { patient: true },
  });
  const same = existing.find(
    (m) =>
      patientName(m.patient).toLowerCase() === patient.name.toLowerCase() &&
      m.patient.dob.toISOString().slice(0, 10) === patient.dob,
  );
  if (same) return same.id;

  const hasSelf = existing.some((m) => m.relation === "SELF");
  const relation: FamilyMemberRelation =
    patient.relation === "SELF" && hasSelf ? "OTHER" : patient.relation;

  return prisma.$transaction(async (tx) => {
    const created = await createLinkedPatient(
      { fullName: patient.name, gender: patient.gender, dob: patient.dob, mobile },
      tx,
    );
    const member = await tx.familyMember.create({
      data: { appUserId, patientId: created.id, relation },
    });
    return member.id;
  });
}

async function ensureAddress(appUserId: string, address: DraftPayload["address"]): Promise<string> {
  const existing = await prisma.address.findFirst({
    where: {
      appUserId,
      pincode: address.pincode,
      address: { equals: address.line, mode: "insensitive" },
      houseNo: address.houseNo,
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await addAddress(
    appUserId,
    {
      name: "home",
      house_no: address.houseNo ?? undefined,
      address: address.line,
      locality: address.locality ?? undefined,
      landmark: address.landmark ?? undefined,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      lat: address.lat ?? undefined,
      long: address.lng ?? undefined,
    },
    false,
  );
  return created.id;
}

// ─── confirm ───────────────────────────────────────────────────────────────

export type ConfirmOutcome =
  | {
      ok: true;
      alreadyBooked: boolean;
      orderNumber: string;
      total: number;
      slot: string;
      date: string;
      kind: DraftPayload["kind"];
      fasting: string[];
    }
  | { ok: false; reason: "not_found" | "expired" | "changed" | "unavailable"; message: string };

function asPayload(draft: WhatsappBookingDraft): DraftPayload {
  return draft.payload as unknown as DraftPayload;
}

// Serialises confirms per draft inside this process (double taps arrive
// milliseconds apart); the DB guards below are what make it correct.
const inFlight = new Map<string, Promise<ConfirmOutcome>>();

export function confirmDraft(
  conversationId: string,
  phone: string,
  draftId: string,
  hashPrefix: string | null,
): Promise<ConfirmOutcome> {
  const running = inFlight.get(draftId);
  if (running) return running.then((r) => (r.ok ? { ...r, alreadyBooked: true } : r));
  const p = confirmDraftUnlocked(conversationId, phone, draftId, hashPrefix).finally(() =>
    inFlight.delete(draftId),
  );
  inFlight.set(draftId, p);
  return p;
}

async function confirmDraftUnlocked(
  conversationId: string,
  phone: string,
  draftId: string,
  hashPrefix: string | null,
): Promise<ConfirmOutcome> {
  const draft = await prisma.whatsappBookingDraft.findFirst({
    where: { id: draftId, conversationId },
    include: { appOrder: true },
  });
  if (!draft) return { ok: false, reason: "not_found", message: "Booking draft not found" };
  const payload = asPayload(draft);

  if (draft.status === "CONFIRMED" && draft.appOrder) {
    return {
      ok: true,
      alreadyBooked: true,
      orderNumber: draft.appOrder.orderNumber,
      total: Number(draft.appOrder.totalPayable),
      slot: payload.slotTime,
      date: payload.date,
      kind: payload.kind,
      fasting: payload.fasting,
    };
  }
  if (draft.status !== "DRAFT" || draft.expiresAt.getTime() < Date.now()) {
    if (draft.status === "DRAFT") {
      await prisma.whatsappBookingDraft.update({
        where: { id: draft.id },
        data: { status: "EXPIRED" },
      });
    }
    return { ok: false, reason: "expired", message: "This booking summary has expired" };
  }
  if (hashPrefix && !draft.summaryHash.startsWith(hashPrefix)) {
    return { ok: false, reason: "changed", message: "This summary was changed after it was shown" };
  }
  if (draft.summaryHash !== summaryHash(draft.id, buildSummary(payload))) {
    return { ok: false, reason: "changed", message: "Booking details changed" };
  }

  // Re-check the slot and re-price NOW — the customer agreed to the total in
  // the summary, so a different total is not booked silently.
  const area = await resolvePincode(payload.address.pincode);
  const open = area ? await listOpenSlots(area, payload.date) : [];
  if (!area || !open.some((s) => s.slot_id === payload.slotId)) {
    await prisma.whatsappBookingDraft.update({
      where: { id: draft.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false, reason: "unavailable", message: "That slot just got booked" };
  }
  const nowTotal =
    payload.kind === "CATALOG"
      ? (await computeQuote(payload.items, area, payload.slotId)).total
      : await computeHomeVisitCharge(area, payload.slotId);
  if (nowTotal !== payload.quote.total) {
    await prisma.whatsappBookingDraft.update({
      where: { id: draft.id },
      data: { status: "EXPIRED" },
    });
    return {
      ok: false,
      reason: "changed",
      message: "The price changed since the summary was shown",
    };
  }

  const appUser = await ensureAppUser(phone, conversationId);
  const familyMemberId = await ensureFamilyMember(appUser.id, phone, payload.patient);
  const addressId = await ensureAddress(appUser.id, payload.address);

  try {
    if (payload.kind === "CATALOG") {
      const result = await createDirectCashBooking(
        appUser.id,
        {
          lines: payload.items.map((i) => ({ itemType: i.type, itemId: i.id, familyMemberId })),
          address_id: addressId,
          slot_id: payload.slotId,
          date: payload.date,
        },
        "WHATSAPP",
        async (tx, orderId) => {
          // Claimed inside the booking transaction: a second confirm of the
          // same draft matches zero rows here and its whole booking rolls back.
          const claimed = await tx.whatsappBookingDraft.updateMany({
            where: { id: draft.id, status: "DRAFT", appOrderId: null },
            data: { status: "CONFIRMED", appOrderId: orderId, confirmedAt: new Date() },
          });
          if (claimed.count === 0) throw ApiError.conflict("Draft already confirmed");
        },
      );
      return {
        ok: true,
        alreadyBooked: false,
        orderNumber: result.order_number,
        total: result.total_payable,
        slot: payload.slotTime,
        date: payload.date,
        kind: payload.kind,
        fasting: payload.fasting,
      };
    }

    // Home visit: `createHomeVisitBooking` runs its own transaction, so the
    // draft is claimed first and released again if the booking fails.
    const claimed = await prisma.whatsappBookingDraft.updateMany({
      where: { id: draft.id, status: "DRAFT", appOrderId: null },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    if (claimed.count === 0) throw ApiError.conflict("Draft already confirmed");
    try {
      const visit = await createHomeVisitBooking(
        appUser.id,
        {
          family_member_id: familyMemberId,
          address_id: addressId,
          slot_id: payload.slotId,
          date: payload.date,
          symptom_notes: payload.symptomNotes ?? "",
        },
        "WHATSAPP",
      );
      await prisma.whatsappBookingDraft.update({
        where: { id: draft.id },
        data: { appOrderId: visit.order_id },
      });
      return {
        ok: true,
        alreadyBooked: false,
        orderNumber: visit.order_number,
        total: visit.total_payable,
        slot: payload.slotTime,
        date: payload.date,
        kind: payload.kind,
        fasting: [],
      };
    } catch (error) {
      await prisma.whatsappBookingDraft.updateMany({
        where: { id: draft.id, appOrderId: null },
        data: { status: "DRAFT", confirmedAt: null },
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
      const fresh = await prisma.whatsappBookingDraft.findUnique({
        where: { id: draft.id },
        include: { appOrder: true },
      });
      if (fresh?.appOrder) {
        return {
          ok: true,
          alreadyBooked: true,
          orderNumber: fresh.appOrder.orderNumber,
          total: Number(fresh.appOrder.totalPayable),
          slot: payload.slotTime,
          date: payload.date,
          kind: payload.kind,
          fasting: payload.fasting,
        };
      }
      return { ok: false, reason: "unavailable", message: error.message };
    }
    logger.error("WhatsApp booking failed", { draftId: draft.id, error: String(error) });
    throw error;
  }
}

/** Human-readable confirmation sent after a successful booking. */
export function bookingConfirmationText(outcome: Extract<ConfirmOutcome, { ok: true }>): string {
  const lines = [
    outcome.alreadyBooked
      ? `✅ Aapki booking pehle hi confirm ho chuki hai. Booking ID: *${outcome.orderNumber}*`
      : `✅ Booking confirm ho gayi! Booking ID: *${outcome.orderNumber}*`,
    `📅 ${displayDate(outcome.date)}, ${outcome.slot}`,
    outcome.kind === "HOME_VISIT"
      ? `💰 Home visit charge ${rupees(outcome.total)}, tests visit par decide honge. Payment cash on collection.`
      : `💰 Total ${rupees(outcome.total)} — cash on collection.`,
    "Hamare phlebotomist slot time par aapke ghar aayenge; assign hone par aapko message milega.",
  ];
  if (outcome.fasting.length) lines.push(`⚠️ ${outcome.fasting.join(" ")}`);
  return lines.join("\n");
}

export function confirmFailureText(outcome: Extract<ConfirmOutcome, { ok: false }>): string {
  switch (outcome.reason) {
    case "expired":
      return 'Yeh booking summary expire ho gayi hai (30 minute). Main details dobara check karke nayi summary bhejta hoon — bas "book" likh dijiye.';
    case "changed":
      return 'Summary bhejne ke baad details/price badal gaye hain, isliye yeh confirm nahi ho sakti. Kripya "book" likhein, main updated summary bhejta hoon.';
    case "unavailable":
      return 'Maaf kijiye, yeh slot abhi-abhi full ho gaya. Kripya doosra slot chuniye — "slots" likh dijiye.';
    case "not_found":
      return 'Yeh booking summary nahi mili. Kripya "book" likh kar dobara shuru karein.';
  }
}
