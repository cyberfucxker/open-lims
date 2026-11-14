import type { AppOrderStatus } from "@prisma/client";
import { prisma } from "../../../config/database";
import { env } from "../../../config/env";
import { signPayload, verifySignature } from "../../../utils/crypto.util";
import { ApiError } from "../../../utils/ApiError";
import { humanizeOrderStatus } from "../../orderNotification.service";
import { cancelOrder, rescheduleOrder } from "../../app/order.service";
import { nextTicketNumber } from "../../../utils/idGenerator";
import { isAffirmative } from "../intent.util";
import { patientName } from "../booking.service";
import { assertBookableDate, slotLabel, todayIst } from "./catalogue.tools";
import { ToolError, trackAmounts, type ToolContext } from "./context";

/**
 * Order tools. Every lookup is scoped by `ctx.phone` — the verified WhatsApp
 * sender — and an order that is not theirs is reported exactly like one that
 * does not exist.
 */

const NOT_FOUND = { found: false, message: "No order with this number on your WhatsApp number." };

const REPORT_READY = new Set(["APPROVED", "SUBMITTED", "PRINTED"]);
export const REPORT_LINK_TTL_MS = 15 * 60 * 1000;
const DOB_MAX_FAILURES = 3;
const DOB_LOCK_MS = 30 * 60 * 1000;
/** Same text for every failure — wrong order, wrong DOB, or locked. */
const REPORT_CHECK_FAILED =
  "Details match nahi hue, isliye report share nahi kar sakte. Kripya order number aur patient ki date of birth dobara check karein.";

function senderOrderWhere(ctx: ToolContext) {
  if (!ctx.phone) return null;
  return { isDraft: false, appUser: { mobile: ctx.phone } };
}

const ORDER_INCLUDE = {
  slotTemplate: true,
  slot: true,
  phlebotomist: { select: { name: true } },
  items: { select: { name: true, familyMemberId: true } },
  appointments: {
    include: {
      familyMember: { include: { patient: true } },
      appointment: { include: { report: { select: { status: true } } } },
    },
  },
  homeVisitFamilyMember: { include: { patient: true } },
} as const;

type OrderWithDetails = NonNullable<
  Awaited<ReturnType<typeof prisma.appOrder.findFirst<{ include: typeof ORDER_INCLUDE }>>>
>;

const PHLEBO_VISIBLE: ReadonlySet<AppOrderStatus> = new Set([
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
  "SAMPLE_COLLECTED",
]);

function summarise(ctx: ToolContext, order: OrderWithDetails) {
  const slot = order.slotTemplate
    ? slotLabel(order.slotTemplate.startTime, order.slotTemplate.endTime)
    : order.slot
      ? slotLabel(order.slot.startTime, order.slot.endTime)
      : null;
  const patients = new Set(order.appointments.map((a) => patientName(a.familyMember.patient)));
  if (order.homeVisitFamilyMember) patients.add(patientName(order.homeVisitFamilyMember.patient));
  const reports = order.appointments.map((a) => a.appointment.report?.status ?? null);
  const readyCount = reports.filter((s) => s && REPORT_READY.has(s)).length;
  trackAmounts(ctx.turn, Number(order.totalPayable));
  return {
    order_number: order.orderNumber,
    status: humanizeOrderStatus(order.status),
    type: order.orderType === "HOME_VISIT" ? "Home visit" : "Tests",
    collection_date: order.orderDate.toISOString().slice(0, 10),
    slot,
    patients: [...patients],
    tests: order.items.map((i) => i.name).slice(0, 10),
    total: Number(order.totalPayable),
    payment: `${order.paymentMode === "ONLINE" ? "Online" : "Cash on collection"} — ${
      order.paymentStatus === "PAID" ? "paid" : "pending"
    }`,
    phlebotomist: PHLEBO_VISIBLE.has(order.status) ? (order.phlebotomist?.name ?? null) : null,
    reports:
      reports.length === 0
        ? "not started"
        : readyCount === reports.length
          ? "ready"
          : readyCount > 0
            ? `${readyCount} of ${reports.length} ready`
            : "in progress",
  };
}

export async function getMyOrders(ctx: ToolContext) {
  const where = senderOrderWhere(ctx);
  if (!where) return { orders: [], message: "No orders on this WhatsApp number." };
  const orders = await prisma.appOrder.findMany({
    where,
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return orders.length
    ? { orders: orders.map((o) => summarise(ctx, o)) }
    : { orders: [], message: "No orders on this WhatsApp number." };
}

async function findOwnOrder(ctx: ToolContext, orderNumber: unknown) {
  const where = senderOrderWhere(ctx);
  const number = String(orderNumber ?? "")
    .trim()
    .toUpperCase();
  if (!where || !/^[A-Z0-9-]{3,20}$/.test(number)) return null;
  return prisma.appOrder.findFirst({
    where: { ...where, orderNumber: number },
    include: ORDER_INCLUDE,
  });
}

export async function getOrderStatus(ctx: ToolContext, input: { order_number: string }) {
  const order = await findOwnOrder(ctx, input.order_number);
  return order ? { found: true, order: summarise(ctx, order) } : NOT_FOUND;
}

// ─── Report links (DOB check + short-lived signed URL) ─────────────────────

/** `<reportId>.<appUserId>.<expiresAtMs>.<sig>` — verified by
 *  `GET /api/webhook/whatsapp/report/:token`. */
export function signReportToken(reportId: string, appUserId: string, expiresAt: number): string {
  const payload = `${reportId}.${appUserId}.${expiresAt}`;
  return `${payload}.${signPayload("wa-report", payload)}`;
}

export function verifyReportToken(token: string): { reportId: string; appUserId: string } {
  const parts = token.split(".");
  if (parts.length !== 4) throw ApiError.notFound("Link not found");
  const [reportId, appUserId, expires, sig] = parts;
  if (!verifySignature("wa-report", `${reportId}.${appUserId}.${expires}`, sig)) {
    throw ApiError.notFound("Link not found");
  }
  if (Number(expires) < Date.now()) {
    throw ApiError.forbidden("This report link has expired. Ask on WhatsApp for a new one.");
  }
  return { reportId, appUserId };
}

export async function getReportLink(
  ctx: ToolContext,
  input: { order_number: string; patient_dob: string },
) {
  if (!ctx.conversationId) {
    // Try-it: never mint a real link.
    return {
      simulated: true,
      message: "Dry run — a report link would be sent after the DOB check.",
    };
  }
  const conversation = await prisma.whatsappConversation.findUniqueOrThrow({
    where: { id: ctx.conversationId },
  });
  if (conversation.reportCheckLockedUntil && conversation.reportCheckLockedUntil > new Date()) {
    return { ok: false, message: REPORT_CHECK_FAILED };
  }

  const order = await findOwnOrder(ctx, input.order_number);
  const dob = String(input.patient_dob ?? "").trim();
  const matching = order?.appointments.filter(
    (a) => a.familyMember.patient.dob.toISOString().slice(0, 10) === dob,
  );

  if (!order || !matching || matching.length === 0) {
    const failures = conversation.reportCheckFailures + 1;
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data:
        failures >= DOB_MAX_FAILURES
          ? { reportCheckFailures: 0, reportCheckLockedUntil: new Date(Date.now() + DOB_LOCK_MS) }
          : { reportCheckFailures: failures },
    });
    return { ok: false, message: REPORT_CHECK_FAILED };
  }

  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: { reportCheckFailures: 0, reportCheckLockedUntil: null },
  });

  const reports = await prisma.report.findMany({
    where: { appointmentId: { in: matching.map((a) => a.appointmentId) } },
    select: { id: true, status: true, reportNo: true },
  });
  const ready = reports.filter((r) => REPORT_READY.has(r.status));
  if (ready.length === 0) {
    return { ok: true, ready: false, message: "Report abhi ready nahi hai." };
  }
  const base = env.PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    return {
      ok: true,
      ready: true,
      message: "Report ready hai — link abhi bhej nahi pa rahe, team share karegi.",
    };
  }
  const expiresAt = Date.now() + REPORT_LINK_TTL_MS;
  return {
    ok: true,
    ready: true,
    valid_minutes: REPORT_LINK_TTL_MS / 60000,
    links: ready.map((r) => ({
      report_no: r.reportNo,
      url: `${base}/api/webhook/whatsapp/report/${signReportToken(r.id, order.appUserId, expiresAt)}`,
    })),
  };
}

// ─── Reschedule / cancel (existing app code paths) ────────────────────────

export async function requestReschedule(
  ctx: ToolContext,
  input: { order_number: string; date: string; slot_id: string },
) {
  const order = await findOwnOrder(ctx, input.order_number);
  if (!order) return NOT_FOUND;
  assertBookableDate(input.date);
  if (ctx.dryRun) return { simulated: true, message: "Dry run — reschedule not performed." };
  try {
    const result = await rescheduleOrder(order.appUserId, order.id, {
      date: input.date,
      slot_id: input.slot_id,
    });
    ctx.turn.stateChanged = true;
    return {
      ok: true,
      order_number: result.order_number,
      date: result.booking_date,
      slot: result.time_slot,
    };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function cancelBooking(
  ctx: ToolContext,
  input: { order_number: string; reason: string },
) {
  const order = await findOwnOrder(ctx, input.order_number);
  if (!order) return NOT_FOUND;
  // Code-enforced: cancelling needs an explicit "yes" from the customer in
  // the very message this turn is answering.
  if (!isAffirmative(ctx.inbound.text)) {
    throw new ToolError(
      `Ask the customer to confirm cancelling ${order.orderNumber} and wait for an explicit yes.`,
    );
  }
  if (ctx.dryRun) return { simulated: true, message: "Dry run — cancellation not performed." };
  try {
    await cancelOrder(
      order.appUserId,
      order.id,
      (input.reason || "Cancelled on WhatsApp").slice(0, 250),
    );
    ctx.turn.stateChanged = true;
    return { ok: true, order_number: order.orderNumber, status: "Cancelled" };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
}

// ─── Profiles (to reuse an existing patient instead of re-asking) ─────────

export async function getMyProfiles(ctx: ToolContext) {
  if (!ctx.phone) return { profiles: [] };
  const members = await prisma.familyMember.findMany({
    where: { appUser: { mobile: ctx.phone } },
    include: { patient: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  return {
    profiles: members.map((m) => ({
      family_member_id: m.id,
      name: patientName(m.patient),
      relation: m.relation.toLowerCase(),
      gender: m.patient.gender,
      age: Math.floor((Date.parse(todayIst()) - m.patient.dob.getTime()) / (365.25 * 86400000)),
    })),
  };
}

// ─── Handoff ───────────────────────────────────────────────────────────────

export async function handoffToTeam(ctx: ToolContext, input: { reason: string; summary: string }) {
  const reason = String(input.reason ?? "other").slice(0, 100);
  const summary = String(input.summary ?? "").slice(0, 1000);
  ctx.turn.handoff = { reason, summary };
  ctx.turn.stateChanged = true;
  if (ctx.dryRun || !ctx.conversationId) return { ok: true, simulated: ctx.dryRun };
  await flagForHuman(ctx.conversationId, reason, summary);
  return { ok: true };
}

/** Marks the chat for the Handoff queue and, when the sender has an app
 *  account, opens a Support Ticket so it also shows in the existing module. */
export async function flagForHuman(conversationId: string, reason: string, summary: string) {
  const conversation = await prisma.whatsappConversation.update({
    where: { id: conversationId },
    data: {
      needsHuman: true,
      handoffReason: reason,
      handoffSummary: summary,
      handoffAt: new Date(),
    },
  });
  const appUserId =
    conversation.appUserId ??
    (
      await prisma.appUser.findUnique({
        where: { mobile: conversation.contactPhone },
        select: { id: true },
      })
    )?.id;
  if (appUserId) {
    await prisma.supportTicket.create({
      data: {
        ticketNumber: await nextTicketNumber(),
        appUserId,
        subject: `WhatsApp: ${reason}`.slice(0, 255),
        description: summary || "Customer asked for a team member on WhatsApp.",
        type: /complain|refund|angry/i.test(reason) ? "COMPLAINT" : null,
      },
    });
  }
}
