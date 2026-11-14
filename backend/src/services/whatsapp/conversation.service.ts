import type { Prisma, WhatsappMessage } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { runAgent, HISTORY_LIMIT, type AgentResult, type ChatTurn } from "./agent.service";
import { send, downloadMedia, type OutboundMessage } from "./cloudApi.client";
import { transcribe } from "./transcription.service";
import { getRuntimeSettings, MODEL_PRICING, type RuntimeSettings } from "./settings.service";
import {
  isAcknowledgement,
  isAffirmative,
  isGreeting,
  isRedFlag,
  normalizeIndianMobile,
  wantsHuman,
} from "./intent.util";
import {
  patientName,
  bookingConfirmationText,
  confirmButtonId,
  confirmDraft,
  confirmFailureText,
  parseConfirmButtonId,
} from "./booking.service";
import { flagForHuman } from "./tools/orders.tools";
import { loadRebookContext } from "./followUp.service";
import { newTurnState, type ToolContext } from "./tools/context";

/**
 * Decide → answer → send, for one stored inbound message.
 *
 * Code handles everything that must be deterministic (buttons, confirm,
 * red flags, human requests, greetings, acknowledgements, rate limits);
 * only what's left reaches the model.
 */

const TEXT = {
  menu: (brand: string) =>
    `Namaste! 🙏 ${brand} mein aapka swagat hai.\nHum aapki kya madad karein? Neeche se chuniye ya apna sawal type/voice note bhejiye.`,
  handoff:
    "Theek hai 🙏 Hamari team ka ek member aapse jaldi sampark karega. Aap apni baat yahin likh sakte hain.",
  emergency:
    "⚠️ Aapne jo bataya hai woh emergency ho sakti hai. Kripya *abhi* kisi doctor se milein ya emergency number *112* par call karein / nazdeeki hospital jaayein.\nHamari team ko bhi bata diya gaya hai.",
  unsupportedMedia:
    'Maaf kijiye, hum abhi sirf text, voice note aur location samajh paate hain. Kripya apna sawal type karke ya voice note mein bhejiye. Prescription ke liye hamari team se baat karne ke liye "agent" likhein.',
  voiceFailed: "Maaf kijiye, voice note samajh nahi aaya. Kripya apna sawal type karke bhejiye. 🙏",
  voiceOff: "Kripya apna sawal type karke bhejiye — voice note abhi support nahi hai. 🙏",
  rateLimited:
    "Aapke sawal hamari team tak pahuncha diye gaye hain, ek team member aapse jaldi sampark karega. 🙏",
  bookingCancelled:
    "Theek hai, yeh booking cancel kar di gayi (book nahi hui thi). Aur kuch madad chahiye?",
  technical: "Thoda technical issue aa raha hai 🙏 Hamari team aapse jaldi sampark karegi.",
  remindersStopped:
    "Theek hai, test reminders band kar diye gaye. Dobara chahiye toh START likh dijiye. 🙏",
  remindersStarted: "Test reminders dobara chalu kar diye gaye. 👍",
  later: 'Theek hai 👍 Jab bhi test karwana ho, yahan "book" likh dijiye.',
  rebookNotFound: 'Yeh reminder nahi mila. Test book karne ke liye "book" likh dijiye.',
};

const STOP_WORDS =
  /^(stop|unsubscribe|stop reminders?|reminder band( karo)?|band karo|रोकें|बंद करो)$/i;
const START_WORDS = /^(start|start reminders?|reminder chalu( karo)?)$/i;

const MENU_BUTTONS = [
  { id: "menu:book", title: "Book a test" },
  { id: "menu:orders", title: "Check my order" },
  { id: "menu:human", title: "Talk to us" },
];

const UNSUPPORTED_TYPES = new Set([
  "image",
  "document",
  "video",
  "sticker",
  "contacts",
  "unsupported",
]);

// One message at a time per chat, in arrival order. A reply is generated
// for the newest state of the chat and an older reply is dropped if a newer
// message arrived meanwhile (see `isSuperseded`).
const queues = new Map<string, Promise<void>>();

export function enqueueInbound(conversationId: string, messageId: string): Promise<void> {
  const previous = queues.get(conversationId) ?? Promise.resolve();
  const next = previous
    .then(() => handleInbound(messageId))
    .catch((error) => {
      logger.error("WhatsApp inbound handling failed", { messageId, error: String(error) });
    })
    .finally(() => {
      if (queues.get(conversationId) === next) queues.delete(conversationId);
    });
  queues.set(conversationId, next);
  return next;
}

function inboundPayload(message: WhatsappMessage): {
  replyId?: string;
  mediaId?: string;
  mimeType?: string;
} {
  return (message.payload as Record<string, string> | null) ?? {};
}

/** How a stored message reads in the model's history. */
export function historyText(
  m: Pick<WhatsappMessage, "direction" | "author" | "type" | "body" | "payload">,
): string {
  const body = m.body ?? "";
  if (m.direction === "IN" && m.type === "interactive") {
    const replyId = (m.payload as { replyId?: string } | null)?.replyId;
    const context = (m.payload as { context?: string } | null)?.context;
    return `[selected: ${body}${replyId ? ` | id: ${replyId}` : ""}]${context ? ` ${context}` : ""}`;
  }
  if (m.direction === "OUT" && m.author === "STAFF") return `[our team member wrote] ${body}`;
  return body;
}

async function loadHistory(conversationId: string): Promise<ChatTurn[]> {
  const rows = await prisma.whatsappMessage.findMany({
    where: {
      conversationId,
      NOT: [{ direction: "OUT", status: "failed" }, { type: "reaction" }],
    },
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
    take: HISTORY_LIMIT,
  });
  return rows.reverse().map((m) => ({
    role: m.direction === "IN" ? ("user" as const) : ("assistant" as const),
    text: historyText(m),
  }));
}

async function isSuperseded(message: WhatsappMessage): Promise<boolean> {
  const newer = await prisma.whatsappMessage.count({
    where: {
      conversationId: message.conversationId,
      direction: "IN",
      // createdAt, not sentAt: Meta's timestamps are whole seconds, so two
      // quick messages can share one.
      createdAt: { gt: message.createdAt },
      type: { not: "reaction" },
    },
  });
  return newer > 0;
}

/** The Confirm button id of the summary we sent last, if the newest thing
 *  we sent is a booking summary awaiting an answer. */
async function pendingConfirmId(conversationId: string): Promise<string | null> {
  const lastOut = await prisma.whatsappMessage.findFirst({
    where: { conversationId, direction: "OUT", status: { not: "failed" } },
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
  });
  const id = (lastOut?.payload as { buttons?: Array<{ id: string }> } | null)?.buttons?.[0]?.id;
  return id?.startsWith("wa_confirm:") ? id : null;
}

function costUsd(model: RuntimeSettings["model"], usage: AgentResult["usage"]): number {
  const p = MODEL_PRICING[model];
  return (
    (usage.input * p.input +
      usage.output * p.output +
      usage.cacheRead * p.cacheRead +
      usage.cacheWrite * p.cacheWrite) /
    1_000_000
  );
}

async function logReply(data: Prisma.WhatsappAiReplyUncheckedCreateInput) {
  try {
    await prisma.whatsappAiReply.create({ data });
  } catch (error) {
    logger.error("Could not write WhatsApp AI log", { error: String(error) });
  }
}

const system = (conversationId: string, message: OutboundMessage) =>
  send(conversationId, message, { author: "SYSTEM" });

async function handOff(
  conversationId: string,
  reason: string,
  summary: string,
  text = TEXT.handoff,
) {
  await flagForHuman(conversationId, reason, summary);
  await system(conversationId, { type: "text", body: text });
}

async function handleConfirm(conversationId: string, phone: string | null, confirmId: string) {
  const parsed = parseConfirmButtonId(confirmId);
  if (!parsed || !phone) {
    await handOff(
      conversationId,
      "booking_confirm_failed",
      "Customer tried to confirm a booking that could not be read.",
    );
    return;
  }
  try {
    const outcome = await confirmDraft(conversationId, phone, parsed.draftId, parsed.hashPrefix);
    await system(conversationId, {
      type: "text",
      body: outcome.ok ? bookingConfirmationText(outcome) : confirmFailureText(outcome),
    });
  } catch (error) {
    logger.error("WhatsApp confirm failed", { conversationId, error: String(error) });
    await handOff(
      conversationId,
      "booking_failed",
      "Booking could not be completed after the customer confirmed.",
      TEXT.technical,
    );
  }
}

export async function handleInbound(messageId: string): Promise<void> {
  const message = await prisma.whatsappMessage.findUnique({
    where: { id: messageId },
    include: { conversation: { include: { account: true } } },
  });
  if (!message || message.direction !== "IN") return;
  const conversation = message.conversation;
  const settings = await getRuntimeSettings();
  const payload = inboundPayload(message);
  let text = message.body ?? "";

  // Voice notes are transcribed even when the AI is off — staff read them.
  if (message.type === "audio") {
    if (!settings.voiceEnabled || !settings.sttKey || !payload.mediaId) {
      if (settings.enabled && !conversation.humanTakeover) {
        await system(conversation.id, { type: "text", body: TEXT.voiceOff });
      }
      return;
    }
    try {
      const media = await downloadMedia(conversation.account, payload.mediaId);
      text = await transcribe(settings.sttProvider, settings.sttKey, media.bytes, media.mimeType);
      await prisma.whatsappMessage.update({
        where: { id: message.id },
        data: { body: `[voice] ${text}` },
      });
    } catch (error) {
      logger.warn("Voice note transcription failed", { messageId, error: String(error) });
      await prisma.whatsappMessage.update({
        where: { id: message.id },
        data: { body: "[voice] (could not transcribe)" },
      });
      if (settings.enabled && !conversation.humanTakeover) {
        await system(conversation.id, { type: "text", body: TEXT.voiceFailed });
      }
      return;
    }
  }

  if (!settings.enabled || conversation.humanTakeover) return;
  if (message.type === "reaction") return;
  if (UNSUPPORTED_TYPES.has(message.type)) {
    await system(conversation.id, { type: "text", body: TEXT.unsupportedMedia });
    return;
  }

  const phone = normalizeIndianMobile(conversation.waId);
  const replyId = payload.replyId ?? null;

  // ── Buttons with a fixed meaning ──
  if (replyId?.startsWith("wa_confirm:")) {
    await handleConfirm(conversation.id, phone, replyId);
    return;
  }
  if (replyId?.startsWith("wa_cancel:")) {
    await prisma.whatsappBookingDraft.updateMany({
      where: {
        id: replyId.slice("wa_cancel:".length),
        conversationId: conversation.id,
        status: "DRAFT",
      },
      data: { status: "CANCELLED" },
    });
    await system(conversation.id, { type: "text", body: TEXT.bookingCancelled });
    return;
  }
  if (!replyId && STOP_WORDS.test(text.trim())) {
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { remindersOptedOut: true },
    });
    await system(conversation.id, { type: "text", body: TEXT.remindersStopped });
    return;
  }
  if (!replyId && START_WORDS.test(text.trim())) {
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { remindersOptedOut: false },
    });
    await system(conversation.id, { type: "text", body: TEXT.remindersStarted });
    return;
  }
  if (replyId?.startsWith("later:")) {
    await system(conversation.id, { type: "text", body: TEXT.later });
    return;
  }
  if (replyId?.startsWith("rebook:")) {
    const rebook = await loadRebookContext(replyId.slice("rebook:".length), phone);
    if (!rebook?.member) {
      await system(conversation.id, { type: "text", body: TEXT.rebookNotFound });
      return;
    }
    const { reminder, member, lastAddress } = rebook;
    // What the model needs to go straight to date/slot — stored on the
    // message so it is in the history for the rest of this booking.
    const context =
      `Customer tapped "Book now" on a reminder to repeat ${reminder.itemName} ` +
      `(item ${reminder.itemType} id ${reminder.itemId}) for ${patientName(member.patient)} ` +
      `(family_member_id ${member.id}).` +
      (lastAddress
        ? ` Last collection address: ${[lastAddress.houseNo, lastAddress.address, lastAddress.locality].filter(Boolean).join(", ")}, ${lastAddress.city} ${lastAddress.pincode} — confirm it is still correct.`
        : " Ask for the address.");
    await prisma.whatsappMessage.update({
      where: { id: message.id },
      data: { payload: { ...payload, context } },
    });
    if (!settings.anthropicKey) {
      await handOff(
        conversation.id,
        "rebook_request",
        `Wants to repeat ${reminder.itemName} for ${patientName(member.patient)}.`,
      );
      return;
    }
    text = context;
  }
  if (replyId === "menu:human") {
    await handOff(conversation.id, "request_human", "Customer tapped 'Talk to us'.");
    return;
  }

  // ── Safety and routing that must not depend on the model ──
  if (isRedFlag(text)) {
    await handOff(
      conversation.id,
      "emergency",
      "Possible emergency symptoms reported — see the chat.",
      TEXT.emergency,
    );
    return;
  }
  if (!replyId && wantsHuman(text)) {
    await handOff(conversation.id, "request_human", "Customer asked for a person.");
    return;
  }
  const pendingConfirm = await pendingConfirmId(conversation.id);
  if (pendingConfirm && !replyId && isAffirmative(text)) {
    await handleConfirm(conversation.id, phone, pendingConfirm);
    return;
  }
  if (!replyId && isGreeting(text)) {
    await system(conversation.id, {
      type: "buttons",
      body: TEXT.menu(settings.brandName),
      buttons: MENU_BUTTONS,
    });
    return;
  }
  if (!replyId && isAcknowledgement(text)) return;

  // ── Per-chat hourly cap ──
  const repliesLastHour = await prisma.whatsappAiReply.count({
    where: {
      conversationId: conversation.id,
      dryRun: false,
      status: { in: ["replied", "handoff"] },
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (repliesLastHour >= settings.maxRepliesPerHour) {
    if (!conversation.needsHuman) {
      await handOff(
        conversation.id,
        "rate_limited",
        "AI reply limit for this hour reached.",
        TEXT.rateLimited,
      );
    }
    return;
  }

  if (!settings.anthropicKey) {
    logger.warn("WhatsApp AI is enabled but no Anthropic key is set");
    return;
  }

  // ── The model ──
  const ctx: ToolContext = {
    conversationId: conversation.id,
    phone,
    dryRun: false,
    inbound: { text, replyId },
    turn: newTurnState(),
  };
  const history = await loadHistory(conversation.id);
  const base = {
    conversationId: conversation.id,
    inboundMessageId: message.id,
    question: text.slice(0, 1000),
    model: settings.model,
  };

  let result: AgentResult;
  try {
    result = await runAgent(settings, history, ctx);
  } catch (error) {
    logger.error("WhatsApp AI call failed", {
      conversationId: conversation.id,
      error: String(error),
    });
    await logReply({
      ...base,
      status: "error",
      error: String(error).slice(0, 1000),
      handoff: true,
    });
    await handOff(
      conversation.id,
      "ai_error",
      "The assistant could not answer (technical error).",
      TEXT.technical,
    );
    return;
  }

  const usage = {
    inputTokens: result.usage.input,
    outputTokens: result.usage.output,
    cacheReadTokens: result.usage.cacheRead,
    cacheWriteTokens: result.usage.cacheWrite,
    toolCalls: result.toolRuns as unknown as Prisma.InputJsonValue,
  };

  // A newer customer message is waiting — answer that one instead, unless
  // this turn already changed something the customer must hear about.
  if (!ctx.turn.stateChanged && (await isSuperseded(message))) {
    await logReply({ ...base, ...usage, status: "skipped", answer: result.text || null });
    return;
  }

  let outbound: OutboundMessage | null = null;
  let status = "replied";
  let handoff = false;

  if (result.forcedHandoff) {
    await flagForHuman(
      conversation.id,
      `ai_${result.forcedHandoff}`,
      "The assistant handed this chat over — see the conversation.",
    );
    outbound = { type: "text", body: TEXT.handoff };
    status = "handoff";
    handoff = true;
  } else if (ctx.turn.summary) {
    const { draftId, text: summary, hash } = ctx.turn.summary;
    outbound = {
      type: "buttons",
      body: summary,
      buttons: [
        { id: confirmButtonId(draftId, hash), title: "✅ Confirm" },
        { id: `wa_change:${draftId}`, title: "✏️ Change" },
        { id: `wa_cancel:${draftId}`, title: "❌ Cancel" },
      ],
    };
  } else if (ctx.turn.options) {
    outbound = {
      type: "list",
      body: ctx.turn.options.body,
      button: ctx.turn.options.button,
      sections: [{ title: "Options", rows: ctx.turn.options.rows }],
    };
  } else {
    outbound = { type: "text", body: result.text || TEXT.handoff };
  }
  if (ctx.turn.handoff) {
    status = "handoff";
    handoff = true;
  }

  const sent = await send(conversation.id, outbound, { author: "AI" });
  await logReply({
    ...base,
    ...usage,
    replyMessageId: sent.id,
    answer: sent.body,
    status: sent.status === "failed" ? "error" : status,
    error: sent.error,
    handoff,
  });
}

/** Superadmin "Try it": the same agent and tools with every write simulated.
 *  Nothing is sent and nothing is stored except the AI-log row. */
export async function tryIt(input: { message: string; phone?: string; history?: ChatTurn[] }) {
  const settings = await getRuntimeSettings();
  if (!settings.anthropicKey)
    throw ApiError.badRequest("Add the Anthropic API key in Settings first");
  const phone = input.phone ? normalizeIndianMobile(input.phone) : null;
  const history: ChatTurn[] = [
    ...(input.history ?? []).slice(-HISTORY_LIMIT + 1),
    { role: "user", text: input.message },
  ];

  const routed = isRedFlag(input.message)
    ? "emergency handoff (code rule — the model is not called)"
    : wantsHuman(input.message)
      ? "human handoff (code rule — the model is not called)"
      : isGreeting(input.message)
        ? "greeting menu (code rule — the model is not called)"
        : isAcknowledgement(input.message)
          ? "acknowledgement — no reply (code rule)"
          : null;
  if (routed) return { routedByCode: routed, reply: null, toolRuns: [], usage: null, costUsd: 0 };

  const ctx: ToolContext = {
    conversationId: null,
    phone,
    dryRun: true,
    inbound: { text: input.message, replyId: null },
    turn: newTurnState(),
  };
  const result = await runAgent(settings, history, ctx);
  const reply = result.forcedHandoff
    ? `(handoff: ${result.forcedHandoff}) ${TEXT.handoff}`
    : ctx.turn.summary
      ? `${ctx.turn.summary.text}\n[buttons: ✅ Confirm | ✏️ Change | ❌ Cancel]`
      : ctx.turn.options
        ? `${ctx.turn.options.body}\n[list: ${ctx.turn.options.rows.map((r) => r.title).join(" | ")}]`
        : result.text;

  await logReply({
    question: input.message.slice(0, 1000),
    answer: reply,
    model: settings.model,
    inputTokens: result.usage.input,
    outputTokens: result.usage.output,
    cacheReadTokens: result.usage.cacheRead,
    cacheWriteTokens: result.usage.cacheWrite,
    toolCalls: result.toolRuns as unknown as Prisma.InputJsonValue,
    status: result.forcedHandoff || ctx.turn.handoff ? "handoff" : "replied",
    handoff: !!(result.forcedHandoff || ctx.turn.handoff),
    dryRun: true,
  });

  return {
    routedByCode: null,
    reply,
    toolRuns: result.toolRuns,
    usage: result.usage,
    costUsd: costUsd(settings.model, result.usage),
  };
}

// ─── Staff actions ─────────────────────────────────────────────────────────

/** A staff member's manual reply. Stops the AI for this chat (human
 *  takeover) — template/broadcast sends do NOT go through here. */
export async function sendStaffReply(conversationId: string, staffUserId: string, body: string) {
  const text = body.trim();
  if (!text) throw ApiError.badRequest("Message is empty");
  await prisma.whatsappConversation.update({
    where: { id: conversationId },
    data: { humanTakeover: true, needsHuman: false },
  });
  const sent = await send(
    conversationId,
    { type: "text", body: text.slice(0, 4000) },
    { author: "STAFF", staffUserId },
  );
  if (sent.status === "failed")
    throw ApiError.badRequest(sent.error ?? "Message could not be sent");
  return sent;
}

export async function setTakeover(conversationId: string, humanTakeover: boolean) {
  return prisma.whatsappConversation.update({
    where: { id: conversationId },
    data: humanTakeover ? { humanTakeover } : { humanTakeover, needsHuman: false },
  });
}

export { costUsd };
