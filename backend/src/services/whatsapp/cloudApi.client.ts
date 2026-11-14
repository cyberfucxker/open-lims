import axios, { AxiosError } from "axios";
import type { WhatsappAccount, WhatsappAuthor, WhatsappConversation } from "@prisma/client";
import { prisma } from "../../config/database";
import { decryptSecret } from "../../utils/crypto.util";
import { logger } from "../../utils/logger";

/** Meta WhatsApp Cloud API — every outbound message goes through `send()`,
 *  which enforces the 24-hour customer-service window and records the row. */

const GRAPH = "https://graph.facebook.com/v21.0";
const WINDOW_MS = 24 * 60 * 60 * 1000;
/** Voice notes larger than this are refused before download. */
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

export interface ButtonOption {
  id: string;
  title: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export type OutboundMessage =
  | { type: "text"; body: string }
  | { type: "buttons"; body: string; buttons: ButtonOption[] }
  | {
      type: "list";
      body: string;
      button: string;
      sections: Array<{ title: string; rows: ListRow[] }>;
    }
  | { type: "cta_url"; body: string; displayText: string; url: string }
  | {
      type: "template";
      name: string;
      language: string;
      /** Body `{{1}}`, `{{2}}`… values, in order. */
      bodyParams: string[];
      /** Payload for each quick-reply button the template defines, in order —
       *  comes back as the inbound button's `replyId`. */
      buttonPayloads?: string[];
      /** Plain-text rendering stored on the message row for staff to read. */
      preview: string;
    };

function clip(value: string, max: number): string {
  const s = value.trim();
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/** Applies Meta's hard limits so a long title can never fail a send. */
export function toGraphPayload(to: string, message: OutboundMessage): Record<string, unknown> {
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };
  switch (message.type) {
    case "text":
      return {
        ...base,
        type: "text",
        text: { body: clip(message.body, 4096), preview_url: false },
      };
    case "buttons":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: clip(message.body, 1024) },
          action: {
            buttons: message.buttons.slice(0, 3).map((b) => ({
              type: "reply",
              reply: { id: clip(b.id, 256), title: clip(b.title, 20) },
            })),
          },
        },
      };
    case "list": {
      let remaining = 10;
      const sections = message.sections
        .map((section) => {
          const rows = section.rows.slice(0, remaining);
          remaining -= rows.length;
          return {
            title: clip(section.title, 24),
            rows: rows.map((r) => ({
              id: clip(r.id, 200),
              title: clip(r.title, 24),
              ...(r.description ? { description: clip(r.description, 72) } : {}),
            })),
          };
        })
        .filter((s) => s.rows.length > 0);
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: clip(message.body, 1024) },
          action: { button: clip(message.button, 20), sections },
        },
      };
    }
    case "cta_url":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "cta_url",
          body: { text: clip(message.body, 1024) },
          action: {
            name: "cta_url",
            parameters: { display_text: clip(message.displayText, 20), url: message.url },
          },
        },
      };
    case "template":
      return {
        ...base,
        type: "template",
        template: {
          name: message.name,
          language: { code: message.language },
          components: [
            ...(message.bodyParams.length
              ? [
                  {
                    type: "body",
                    parameters: message.bodyParams.map((text) => ({ type: "text", text })),
                  },
                ]
              : []),
            ...(message.buttonPayloads ?? []).map((payload, index) => ({
              type: "button",
              sub_type: "quick_reply",
              index: String(index),
              parameters: [{ type: "payload", payload }],
            })),
          ],
        },
      };
  }
}

/** Plain-text version of what the customer sees — stored as the message
 *  body so the Conversations view and the AI history read naturally. */
export function describeOutbound(message: OutboundMessage): string {
  switch (message.type) {
    case "text":
      return message.body;
    case "buttons":
      return `${message.body}\n[buttons: ${message.buttons.map((b) => b.title).join(" | ")}]`;
    case "list":
      return `${message.body}\n[list: ${message.sections
        .flatMap((s) => s.rows)
        .map((r) => r.title)
        .join(" | ")}]`;
    case "cta_url":
      return `${message.body}\n[link: ${message.displayText}]`;
    case "template":
      return message.preview;
  }
}

export function isWithinServiceWindow(
  conversation: Pick<WhatsappConversation, "lastInboundAt">,
  now = new Date(),
): boolean {
  return (
    !!conversation.lastInboundAt && now.getTime() - conversation.lastInboundAt.getTime() < WINDOW_MS
  );
}

function accessToken(account: WhatsappAccount): string {
  if (!account.accessTokenEnc) {
    throw new Error("WhatsApp access token is not configured");
  }
  return decryptSecret(account.accessTokenEnc);
}

function graphError(error: unknown): string {
  if (error instanceof AxiosError) {
    const meta = (error.response?.data as { error?: { message?: string; code?: number } })?.error;
    return meta ? `${meta.code ?? ""} ${meta.message ?? ""}`.trim() : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

export interface SendOptions {
  author: WhatsappAuthor;
  staffUserId?: string;
}

/**
 * Sends one message and stores it. Never throws for a delivery failure —
 * the row is stored with `status: "failed"` and the error instead, so the
 * conversation view shows exactly what happened.
 *
 * Free-form/interactive messages are refused outside the 24-hour window
 * (Meta would reject them anyway, and it is a policy violation to try);
 * only `template` messages may go out then.
 */
export async function send(conversationId: string, message: OutboundMessage, options: SendOptions) {
  const conversation = await prisma.whatsappConversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { account: true },
  });
  const body = describeOutbound(message);
  const base = {
    conversationId,
    direction: "OUT" as const,
    author: options.author,
    type: message.type,
    body,
    payload: message as unknown as object,
    staffUserId: options.staffUserId ?? null,
  };

  if (message.type !== "template" && !isWithinServiceWindow(conversation)) {
    return prisma.whatsappMessage.create({
      data: {
        ...base,
        status: "failed",
        error: "Outside the 24-hour window — only an approved template can be sent",
      },
    });
  }

  try {
    const response = await axios.post(
      `${GRAPH}/${conversation.account.phoneNumberId}/messages`,
      toGraphPayload(conversation.waId, message),
      { headers: { Authorization: `Bearer ${accessToken(conversation.account)}` }, timeout: 15000 },
    );
    const wamid = (response.data as { messages?: Array<{ id: string }> }).messages?.[0]?.id ?? null;
    const [row] = await prisma.$transaction([
      prisma.whatsappMessage.create({ data: { ...base, wamid, status: "sent" } }),
      prisma.whatsappConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
    return row;
  } catch (error) {
    const reason = graphError(error);
    logger.warn("WhatsApp send failed", { conversationId, type: message.type, reason });
    return prisma.whatsappMessage.create({ data: { ...base, status: "failed", error: reason } });
  }
}

/** Downloads a media object (voice note) — Graph gives a short-lived URL
 *  that itself needs the same bearer token. */
export async function downloadMedia(
  account: WhatsappAccount,
  mediaId: string,
): Promise<{ bytes: Buffer; mimeType: string }> {
  const headers = { Authorization: `Bearer ${accessToken(account)}` };
  const meta = await axios.get<{ url: string; mime_type: string; file_size?: number }>(
    `${GRAPH}/${mediaId}`,
    { headers, timeout: 15000 },
  );
  if ((meta.data.file_size ?? 0) > MAX_MEDIA_BYTES) {
    throw new Error("Media file is too large");
  }
  const file = await axios.get<ArrayBuffer>(meta.data.url, {
    headers,
    responseType: "arraybuffer",
    timeout: 30000,
    maxContentLength: MAX_MEDIA_BYTES,
  });
  return { bytes: Buffer.from(file.data), mimeType: meta.data.mime_type };
}

/** Superadmin "Test connection": reads the number's own profile. */
export async function fetchPhoneNumberInfo(account: WhatsappAccount) {
  const response = await axios.get<{
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
  }>(`${GRAPH}/${account.phoneNumberId}`, {
    headers: { Authorization: `Bearer ${accessToken(account)}` },
    params: { fields: "display_phone_number,verified_name,quality_rating" },
    timeout: 15000,
  });
  return response.data;
}

export { graphError };
