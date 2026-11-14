import { createHmac, timingSafeEqual } from "crypto";
import { Prisma, type WhatsappAccount } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { decryptOptional } from "../../utils/crypto.util";
import { logger } from "../../utils/logger";
import { reverseGeocode } from "../app/geocode.service";
import { enqueueInbound } from "./conversation.service";
import { normalizeIndianMobile } from "./intent.util";

/**
 * Meta webhook: verify handshake, signature check, then parse/store/dispatch.
 * The controller answers 200 before `processPayload` runs — Meta retries
 * anything slower or non-2xx, and the `wamid` unique column turns every
 * retry of an inbound message into a no-op.
 */

export async function loadActiveAccount(accountId: string): Promise<WhatsappAccount> {
  const account = /^[0-9a-f-]{36}$/i.test(accountId)
    ? await prisma.whatsappAccount.findUnique({ where: { id: accountId } })
    : null;
  if (!account || !account.isActive) throw ApiError.notFound("Not found");
  return account;
}

/** GET handshake: echo `hub.challenge` when the verify token matches. */
export async function verifySubscription(
  accountId: string,
  mode: unknown,
  token: unknown,
  challenge: unknown,
): Promise<string> {
  const account = await loadActiveAccount(accountId);
  if (mode !== "subscribe" || typeof token !== "string" || typeof challenge !== "string") {
    throw ApiError.forbidden("Verification failed");
  }
  const a = Buffer.from(token);
  const b = Buffer.from(account.verifyToken);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    throw ApiError.forbidden("Verification failed");
  return challenge;
}

export function isValidSignature(
  rawBody: Buffer,
  header: string | undefined,
  appSecret: string,
): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody).digest("hex"));
  const given = Buffer.from(header.slice("sha256=".length));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Throws (→ 401, nothing processed) when an app secret is configured and
 *  the `X-Hub-Signature-256` header does not match the raw body. */
export function assertSignature(
  account: WhatsappAccount,
  rawBody: Buffer,
  header: string | undefined,
): void {
  const secret = decryptOptional(account.appSecretEnc);
  if (!secret) {
    logger.warn("WhatsApp webhook accepted without signature check — no app secret configured", {
      accountId: account.id,
    });
    return;
  }
  if (!isValidSignature(rawBody, header, secret)) {
    throw ApiError.unauthorized("Invalid signature");
  }
}

// ─── Parsing ───────────────────────────────────────────────────────────────

interface MetaMessage {
  id: string;
  from: string;
  timestamp?: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { payload?: string; text?: string };
  audio?: { id: string; mime_type?: string };
  voice?: { id: string; mime_type?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  reaction?: { emoji?: string };
}

interface MetaStatus {
  id: string;
  status: string;
  errors?: Array<{ code?: number; title?: string; message?: string }>;
}

interface MetaChangeValue {
  metadata?: { phone_number_id?: string };
  contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
}

export interface ParsedInbound {
  type: string;
  body: string | null;
  payload: Record<string, unknown> | null;
}

/** One Meta message → what we store. Exported for tests. */
export function parseMessage(m: MetaMessage): ParsedInbound {
  switch (m.type) {
    case "text":
      return { type: "text", body: m.text?.body ?? "", payload: null };
    case "interactive": {
      const reply = m.interactive?.button_reply ?? m.interactive?.list_reply;
      return {
        type: "interactive",
        body: reply?.title ?? "",
        payload: reply ? { replyId: reply.id } : null,
      };
    }
    case "button": // quick-reply button on a template
      return {
        type: "interactive",
        body: m.button?.text ?? "",
        payload: m.button?.payload ? { replyId: m.button.payload } : null,
      };
    case "audio":
    case "voice": {
      const media = m.audio ?? m.voice;
      return {
        type: "audio",
        body: "[voice]",
        payload: media ? { mediaId: media.id, mimeType: media.mime_type } : null,
      };
    }
    case "location": {
      const loc = m.location;
      if (!loc) return { type: "location", body: "[location]", payload: null };
      const label = [loc.name, loc.address].filter(Boolean).join(", ");
      return {
        type: "location",
        body: `[shared location: latitude ${loc.latitude}, longitude ${loc.longitude}${label ? `, ${label}` : ""}]`,
        payload: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          name: loc.name,
          address: loc.address,
        },
      };
    }
    case "reaction":
      return { type: "reaction", body: m.reaction?.emoji ?? "", payload: null };
    case "image":
    case "document":
    case "video":
    case "sticker":
    case "contacts":
      return { type: m.type, body: `[${m.type}]`, payload: null };
    default:
      return { type: "unsupported", body: `[${m.type}]`, payload: null };
  }
}

/** Adds the map's pincode to a shared location, so the assistant can check
 *  serviceability without asking. Best effort — never blocks the message. */
async function enrichLocation(parsed: ParsedInbound): Promise<ParsedInbound> {
  const lat = parsed.payload?.latitude as number | undefined;
  const lng = parsed.payload?.longitude as number | undefined;
  if (parsed.type !== "location" || lat == null || lng == null) return parsed;
  try {
    const geo = (await Promise.race([
      reverseGeocode(lat, lng),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ])) as { display_name?: string; address?: { postcode?: string } };
    const pincode = geo.address?.postcode?.replace(/\s/g, "");
    return {
      ...parsed,
      body: `${parsed.body?.replace(/\]$/, "")}${geo.display_name ? `; map address: ${geo.display_name}` : ""}${
        pincode ? `; map pincode: ${pincode}` : ""
      }]`,
      payload: { ...parsed.payload, mapAddress: geo.display_name, mapPincode: pincode },
    };
  } catch {
    return parsed;
  }
}

const STATUS_RANK: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

async function applyStatus(status: MetaStatus) {
  const existing = await prisma.whatsappMessage.findUnique({ where: { wamid: status.id } });
  if (!existing) return;
  // Callbacks can arrive out of order — never move "read" back to "delivered".
  if ((STATUS_RANK[status.status] ?? 0) <= (STATUS_RANK[existing.status] ?? 0)) return;
  const error = status.errors?.[0];
  await prisma.whatsappMessage.update({
    where: { id: existing.id },
    data: {
      status: status.status,
      error: error ? `${error.code ?? ""} ${error.title ?? error.message ?? ""}`.trim() : undefined,
    },
  });
}

async function storeInbound(account: WhatsappAccount, value: MetaChangeValue, m: MetaMessage) {
  const contact = value.contacts?.find((c) => c.wa_id === m.from) ?? value.contacts?.[0];
  const waId = m.from;
  const contactPhone = normalizeIndianMobile(waId) ?? waId;
  const sentAt = m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date();
  const parsed = await enrichLocation(parseMessage(m));

  const conversation = await prisma.whatsappConversation.upsert({
    where: { accountId_contactPhone: { accountId: account.id, contactPhone } },
    update: {},
    create: {
      accountId: account.id,
      contactPhone,
      waId,
      contactName: contact?.profile?.name?.slice(0, 150) ?? null,
    },
  });

  let messageId: string;
  try {
    const row = await prisma.whatsappMessage.create({
      data: {
        conversationId: conversation.id,
        wamid: m.id,
        direction: "IN",
        author: "CUSTOMER",
        type: parsed.type,
        body: parsed.body,
        payload: (parsed.payload ?? undefined) as Prisma.InputJsonValue | undefined,
        status: "received",
        sentAt,
      },
    });
    messageId = row.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return; // redelivery of a message we already have — never answer twice
    }
    throw error;
  }

  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: {
      waId,
      lastInboundAt: sentAt > (conversation.lastInboundAt ?? new Date(0)) ? sentAt : undefined,
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      ...(contact?.profile?.name ? { contactName: contact.profile.name.slice(0, 150) } : {}),
    },
  });

  void enqueueInbound(conversation.id, messageId);
}

/** Runs after the 200 has been sent. */
export async function processPayload(account: WhatsappAccount, body: unknown): Promise<void> {
  await prisma.whatsappAccount.update({
    where: { id: account.id },
    data: { lastWebhookAt: new Date() },
  });
  const entries =
    (body as { entry?: Array<{ changes?: Array<{ field?: string; value?: MetaChangeValue }> }> })
      ?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (change.field !== "messages" || !value) continue;
      if (
        value.metadata?.phone_number_id &&
        value.metadata.phone_number_id !== account.phoneNumberId
      )
        continue;
      for (const status of value.statuses ?? []) {
        await applyStatus(status).catch((error) =>
          logger.warn("WhatsApp status update failed", { error: String(error) }),
        );
      }
      for (const message of value.messages ?? []) {
        await storeInbound(account, value, message).catch((error) =>
          logger.error("WhatsApp inbound store failed", {
            wamid: message.id,
            error: String(error),
          }),
        );
      }
    }
  }
}
