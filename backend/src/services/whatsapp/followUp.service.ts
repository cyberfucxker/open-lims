import type { CatalogItemType, FollowUpReminder } from "@prisma/client";
import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";
import { notifyTestFollowUp } from "../orderNotification.service";
import { send } from "./cloudApi.client";
import { normalizeIndianMobile } from "./intent.util";
import { patientName } from "./booking.service";
import { todayIst } from "./tools/catalogue.tools";

/**
 * "Repeat this test" reminders.
 *
 * A Test/Package/Parameter carries `followUpDays` (set in Superadmin). When
 * an order's report is ready, one reminder per patient + item is scheduled
 * that many days later. A job sends due reminders between 9 AM and 8 PM IST
 * as an in-app/push notification plus a WhatsApp template (the item's own
 * `followUpTemplate`, else `test_repeat_reminder`), unless the patient has
 * already booked that item again. The template's "Book now" button comes
 * back as `rebook:<reminderId>` and starts a booking in the chat.
 */

export const DEFAULT_FOLLOW_UP_TEMPLATE = "test_repeat_reminder";
const TEMPLATE_LANGUAGE = "en";
const SEND_FROM_HOUR_IST = 9;
const SEND_UNTIL_HOUR_IST = 20;
const BATCH = 100;

function addDays(isoDate: string, days: number): Date {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function displayDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

async function followUpSettings(itemType: CatalogItemType, itemId: string) {
  return itemType === "TEST"
    ? prisma.test.findUnique({
        where: { id: itemId },
        select: { followUpDays: true, followUpTemplate: true, status: true },
      })
    : prisma.package.findUnique({
        where: { id: itemId },
        select: { followUpDays: true, followUpTemplate: true, active: true, deletedAt: true },
      });
}

/** Called when a report of the order is ready (`notifyReportReady`).
 *  Idempotent — the unique (order, patient, item) key makes a second call,
 *  e.g. for the order's next report, a no-op. */
export async function scheduleFollowUpsForOrder(orderId: string): Promise<number> {
  const order = await prisma.appOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.isDraft || order.status === "CANCELLED") return 0;

  const now = new Date();
  const today = todayIst(now);
  const rows = [];
  for (const item of order.items) {
    const settings = await followUpSettings(item.itemType, item.itemId);
    if (!settings?.followUpDays) continue;
    rows.push({
      appUserId: order.appUserId,
      familyMemberId: item.familyMemberId,
      orderId: order.id,
      itemType: item.itemType,
      itemId: item.itemId,
      itemName: item.name,
      reportReadyAt: now,
      dueDate: addDays(today, settings.followUpDays),
      templateName: settings.followUpTemplate || DEFAULT_FOLLOW_UP_TEMPLATE,
    });
  }
  if (rows.length === 0) return 0;
  const created = await prisma.followUpReminder.createMany({ data: rows, skipDuplicates: true });
  return created.count;
}

/** Called when any order is confirmed: a reminder whose item this order
 *  books again for the same patient is closed — skipped if it had not gone
 *  out yet, counted as a conversion if it had. */
export async function markFollowUpsRebooked(orderId: string): Promise<void> {
  const order = await prisma.appOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.isDraft) return;
  for (const item of order.items) {
    const match = {
      appUserId: order.appUserId,
      familyMemberId: item.familyMemberId,
      itemType: item.itemType,
      itemId: item.itemId,
      orderId: { not: order.id },
    };
    await prisma.followUpReminder.updateMany({
      where: { ...match, status: "SCHEDULED" },
      data: { status: "SKIPPED_REBOOKED", bookedOrderId: order.id },
    });
    await prisma.followUpReminder.updateMany({
      where: { ...match, status: "SENT", sentAt: { lt: order.createdAt } },
      data: { status: "BOOKED", bookedOrderId: order.id },
    });
  }
}

/** Belt and braces at send time: an active booking of the same item for the
 *  same patient made after the report was ready. */
async function findRebooking(reminder: FollowUpReminder): Promise<string | null> {
  const order = await prisma.appOrder.findFirst({
    where: {
      appUserId: reminder.appUserId,
      isDraft: false,
      status: { not: "CANCELLED" },
      id: { not: reminder.orderId },
      createdAt: { gt: reminder.reportReadyAt },
      items: {
        some: {
          familyMemberId: reminder.familyMemberId,
          itemType: reminder.itemType,
          itemId: reminder.itemId,
        },
      },
    },
    select: { id: true },
  });
  return order?.id ?? null;
}

async function conversationFor(mobile: string) {
  const account = await prisma.whatsappAccount.findFirst({
    where: { isActive: true, accessTokenEnc: { not: null } },
    orderBy: { createdAt: "asc" },
  });
  if (!account) return null;
  const existing = await prisma.whatsappConversation.findUnique({
    where: { accountId_contactPhone: { accountId: account.id, contactPhone: mobile } },
  });
  if (existing) return existing;
  return prisma.whatsappConversation.create({
    data: { accountId: account.id, contactPhone: mobile, waId: `91${mobile}` },
  });
}

async function sendReminder(reminder: FollowUpReminder): Promise<void> {
  const rebookedBy = await findRebooking(reminder);
  if (rebookedBy) {
    await prisma.followUpReminder.update({
      where: { id: reminder.id },
      data: { status: "SKIPPED_REBOOKED", bookedOrderId: rebookedBy },
    });
    return;
  }

  const [appUser, member, settings] = await Promise.all([
    prisma.appUser.findUnique({
      where: { id: reminder.appUserId },
      select: { mobile: true, isActive: true },
    }),
    prisma.familyMember.findUnique({
      where: { id: reminder.familyMemberId },
      include: { patient: true },
    }),
    followUpSettings(reminder.itemType, reminder.itemId),
  ]);
  const itemGone =
    !settings ||
    ("status" in settings && settings.status !== "Active") ||
    ("active" in settings && (!settings.active || settings.deletedAt));
  if (!appUser?.isActive || !member || itemGone) {
    await prisma.followUpReminder.update({
      where: { id: reminder.id },
      data: {
        status: "SKIPPED",
        error: !member
          ? "Patient removed"
          : itemGone
            ? "Item no longer offered"
            : "Account inactive",
      },
    });
    return;
  }

  const name = patientName(member.patient).split(" ")[0] || "there";
  const done = displayDate(reminder.reportReadyAt);
  const title = `Time to repeat your ${reminder.itemName}`;
  const body = `${name}'s ${reminder.itemName} report was ready on ${done}. Doctors usually advise repeating it now — book a home collection in a few taps.`;

  let pushSent = false;
  try {
    await notifyTestFollowUp(reminder.appUserId, reminder.orderId, title, body);
    pushSent = true;
  } catch (error) {
    logger.warn("Follow-up push failed", { reminderId: reminder.id, error: String(error) });
  }

  let whatsappStatus = "no_whatsapp";
  let error: string | null = null;
  const mobile = normalizeIndianMobile(appUser.mobile);
  const conversation = mobile ? await conversationFor(mobile) : null;
  if (conversation?.remindersOptedOut) {
    whatsappStatus = "opted_out";
  } else if (conversation) {
    const templateName = reminder.templateName || DEFAULT_FOLLOW_UP_TEMPLATE;
    const sent = await send(
      conversation.id,
      {
        type: "template",
        name: templateName,
        language: TEMPLATE_LANGUAGE,
        bodyParams: [name, reminder.itemName, done],
        buttonPayloads: [`rebook:${reminder.id}`, `later:${reminder.id}`],
        preview: `🔁 Reminder: ${name}, time to repeat ${reminder.itemName} (last report ${done}). [Book now] [Later] — reply STOP to stop reminders.`,
      },
      { author: "TEMPLATE" },
    );
    whatsappStatus = sent.status;
    error = sent.error;
  }

  const delivered = pushSent || whatsappStatus === "sent";
  await prisma.followUpReminder.update({
    where: { id: reminder.id },
    data: {
      status: delivered ? "SENT" : "FAILED",
      pushSent,
      whatsappStatus,
      error,
      sentAt: delivered ? new Date() : null,
    },
  });
}

/** Sends every due reminder, inside sending hours only. */
export async function processDueFollowUps(now = new Date()): Promise<number> {
  const istHour = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000).getUTCHours();
  if (istHour < SEND_FROM_HOUR_IST || istHour >= SEND_UNTIL_HOUR_IST) return 0;
  const due = await prisma.followUpReminder.findMany({
    where: { status: "SCHEDULED", dueDate: { lte: new Date(todayIst(now)) } },
    orderBy: { dueDate: "asc" },
    take: BATCH,
  });
  for (const reminder of due) {
    try {
      await sendReminder(reminder);
    } catch (error) {
      logger.error("Follow-up reminder failed", { reminderId: reminder.id, error: String(error) });
      await prisma.followUpReminder
        .update({
          where: { id: reminder.id },
          data: { status: "FAILED", error: String(error).slice(0, 500) },
        })
        .catch(() => undefined);
    }
  }
  return due.length;
}

export function startFollowUpJob(): NodeJS.Timeout {
  return setInterval(
    () => {
      processDueFollowUps().catch((error) =>
        logger.warn("Follow-up job failed", { error: String(error) }),
      );
    },
    15 * 60 * 1000,
  );
}

/** What the chat needs to continue a "Book now" tap: the reminder, checked
 *  against the sender's own number. */
export async function loadRebookContext(reminderId: string, senderMobile: string | null) {
  if (!senderMobile || !/^[0-9a-f-]{36}$/.test(reminderId)) return null;
  const reminder = await prisma.followUpReminder.findFirst({
    where: { id: reminderId, appUser: { mobile: senderMobile } },
  });
  if (!reminder) return null;
  const [member, lastAddress] = await Promise.all([
    prisma.familyMember.findUnique({
      where: { id: reminder.familyMemberId },
      include: { patient: true },
    }),
    prisma.appOrder
      .findUnique({ where: { id: reminder.orderId }, include: { address: true } })
      .then((o) => o?.address ?? null),
  ]);
  return { reminder, member, lastAddress };
}

// ─── Superadmin ────────────────────────────────────────────────────────────

export async function listFollowUps(filter: { status?: string; page: number; limit: number }) {
  const where = filter.status ? { status: filter.status as FollowUpReminder["status"] } : {};
  const [rows, total, byStatus] = await Promise.all([
    prisma.followUpReminder.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: {
        appUser: { select: { mobile: true, name: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.followUpReminder.count({ where }),
    prisma.followUpReminder.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return {
    total,
    counts: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    reminders: rows.map((r) => ({
      id: r.id,
      itemName: r.itemName,
      itemType: r.itemType,
      dueDate: r.dueDate.toISOString().slice(0, 10),
      status: r.status,
      templateName: r.templateName,
      pushSent: r.pushSent,
      whatsappStatus: r.whatsappStatus,
      error: r.error,
      sentAt: r.sentAt,
      customer: r.appUser.name || r.appUser.mobile,
      mobile: r.appUser.mobile,
      orderNumber: r.order.orderNumber,
      bookedOrderId: r.bookedOrderId,
    })),
  };
}
