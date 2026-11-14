import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";
import { isWithinServiceWindow, send, type OutboundMessage } from "./cloudApi.client";
import { slotLabel, todayIst } from "./tools/catalogue.tools";

/**
 * Order-lifecycle messages on WhatsApp, hooked onto the existing app
 * notification events (`orderNotification.service.ts`).
 *
 * Only customers who have chatted with us on WhatsApp get these. Inside the
 * 24-hour window a normal text goes out; outside it, the pre-approved
 * template of the same name (README → "WhatsApp templates"). Template sends
 * are authored TEMPLATE, so they never count as a human reply.
 */

export type LifecycleEvent =
  "booking_confirmed" | "sample_collection_reminder" | "sample_collected" | "report_ready";

/** Template language registered in Meta for every template below. */
const TEMPLATE_LANGUAGE = "en";

function texts(
  event: LifecycleEvent,
  name: string,
  orderNumber: string,
  when: string,
): { text: string; params: string[] } {
  switch (event) {
    case "booking_confirmed":
      return {
        text: `✅ Hi ${name}, your booking *${orderNumber}* is confirmed for ${when}. We'll message you when a phlebotomist is assigned.`,
        params: [name, orderNumber, when],
      };
    case "sample_collection_reminder":
      return {
        text: `⏰ Reminder: our phlebotomist will visit for booking *${orderNumber}* at ${when}. Please follow any fasting instructions.`,
        params: [name, orderNumber, when],
      };
    case "sample_collected":
      return {
        text: `🧪 Hi ${name}, your sample for booking *${orderNumber}* has been collected and is on its way to the lab.`,
        params: [name, orderNumber],
      };
    case "report_ready":
      return {
        text: `📄 Hi ${name}, your report for booking *${orderNumber}* is ready. Reply "report" here to get a secure download link.`,
        params: [name, orderNumber],
      };
  }
}

export async function notifyWhatsappLifecycle(
  event: LifecycleEvent,
  orderId: string,
): Promise<void> {
  try {
    const order = await prisma.appOrder.findUnique({
      where: { id: orderId },
      include: { appUser: true, slotTemplate: true, slot: true },
    });
    if (!order) return;
    // A WhatsApp booking already got its confirmation in the chat.
    if (event === "booking_confirmed" && order.platform === "WHATSAPP") return;

    const conversation = await prisma.whatsappConversation.findFirst({
      where: { contactPhone: order.appUser.mobile, account: { isActive: true } },
      orderBy: { lastInboundAt: "desc" },
    });
    if (!conversation) return; // never messaged us on WhatsApp — no opt-in

    // Each event goes out once per order (report_ready fires per report).
    const tag = `${event}:${orderId}`;
    const already = await prisma.whatsappMessage.count({
      where: { conversationId: conversation.id, payload: { path: ["lifecycle"], equals: tag } },
    });
    if (already) return;

    const time = order.slotTemplate
      ? slotLabel(order.slotTemplate.startTime, order.slotTemplate.endTime)
      : order.slot
        ? slotLabel(order.slot.startTime, order.slot.endTime)
        : "";
    const when = `${order.orderDate.toISOString().slice(0, 10)} ${time}`.trim();
    const name = (order.appUser.name ?? "").split(" ")[0] || "there";
    const { text, params } = texts(event, name, order.orderNumber, when);

    const message: OutboundMessage = isWithinServiceWindow(conversation)
      ? { type: "text", body: text }
      : {
          type: "template",
          name: event,
          language: TEMPLATE_LANGUAGE,
          bodyParams: params,
          preview: text,
        };
    const sent = await send(conversation.id, message, { author: "TEMPLATE" });
    await prisma.whatsappMessage.update({
      where: { id: sent.id },
      data: { payload: { ...(sent.payload as object), lifecycle: tag } },
    });
  } catch (error) {
    logger.warn("WhatsApp lifecycle message failed", { event, orderId, error: String(error) });
  }
}

/** Collection reminders, ~2 hours before the slot. In-process timer — the
 *  API runs as a single PM2 instance (see ecosystem.config.js). */
export function startReminderJob(): NodeJS.Timeout {
  const tick = async () => {
    try {
      const today = todayIst();
      const istNow = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000).toISOString().slice(11, 16);
      const [h, m] = istNow.split(":").map(Number);
      const inTwoHours = `${String(Math.min(h + 2, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const orders = await prisma.appOrder.findMany({
        where: {
          isDraft: false,
          orderDate: new Date(today),
          status: { in: ["CONFIRMED", "ACCEPTED"] },
          slotTemplate: { startTime: { gt: istNow, lte: inTwoHours } },
        },
        select: { id: true },
        take: 200,
      });
      // `notifyWhatsappLifecycle` skips anyone without a WhatsApp chat and
      // any order already reminded.
      for (const order of orders)
        await notifyWhatsappLifecycle("sample_collection_reminder", order.id);
    } catch (error) {
      logger.warn("WhatsApp reminder job failed", { error: String(error) });
    }
  };
  return setInterval(() => void tick(), 15 * 60 * 1000);
}
