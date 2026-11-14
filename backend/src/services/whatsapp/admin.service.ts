import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { MODEL_PRICING, type AiModel } from "./settings.service";

/** Read models for the Superadmin "WhatsApp Assistant" screens. */

export interface ConversationFilter {
  view?: "all" | "handoff" | "takeover";
  search?: string;
  page: number;
  limit: number;
}

export async function listConversations(filter: ConversationFilter) {
  const where: Prisma.WhatsappConversationWhereInput = {
    ...(filter.view === "handoff" ? { needsHuman: true } : {}),
    ...(filter.view === "takeover" ? { humanTakeover: true } : {}),
    ...(filter.search
      ? {
          OR: [
            { contactPhone: { contains: filter.search } },
            { contactName: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.whatsappConversation.findMany({
      where,
      orderBy: filter.view === "handoff" ? { handoffAt: "desc" } : { lastMessageAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: {
        account: { select: { label: true } },
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { body: true, author: true, sentAt: true },
        },
      },
    }),
    prisma.whatsappConversation.count({ where }),
  ]);
  return {
    total,
    conversations: rows.map((c) => ({
      id: c.id,
      contactPhone: c.contactPhone,
      contactName: c.contactName,
      account: c.account.label,
      lastMessage: c.messages[0] ?? null,
      lastMessageAt: c.lastMessageAt,
      lastInboundAt: c.lastInboundAt,
      unreadCount: c.unreadCount,
      humanTakeover: c.humanTakeover,
      needsHuman: c.needsHuman,
      handoffReason: c.handoffReason,
      handoffSummary: c.handoffSummary,
      handoffAt: c.handoffAt,
    })),
  };
}

export async function getConversation(id: string) {
  const conversation = await prisma.whatsappConversation.findUnique({
    where: { id },
    include: {
      account: { select: { label: true, displayPhone: true } },
      appUser: { select: { id: true, name: true, mobile: true } },
      messages: { orderBy: { sentAt: "asc" }, take: 500 },
      drafts: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          appOrder: { select: { id: true, orderNumber: true, status: true, totalPayable: true } },
        },
      },
    },
  });
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (conversation.unreadCount > 0) {
    await prisma.whatsappConversation.update({ where: { id }, data: { unreadCount: 0 } });
  }
  const { messages, drafts, ...rest } = conversation;
  return {
    ...rest,
    windowOpen:
      !!conversation.lastInboundAt &&
      Date.now() - conversation.lastInboundAt.getTime() < 24 * 60 * 60 * 1000,
    messages: messages.map((m) => ({
      id: m.id,
      direction: m.direction,
      author: m.author,
      type: m.type,
      body: m.body,
      status: m.status,
      error: m.error,
      sentAt: m.sentAt,
    })),
    bookings: drafts.map((d) => ({
      draftId: d.id,
      status: d.status,
      createdAt: d.createdAt,
      expiresAt: d.expiresAt,
      order: d.appOrder ? { ...d.appOrder, totalPayable: Number(d.appOrder.totalPayable) } : null,
    })),
  };
}

export async function resolveHandoff(id: string) {
  return prisma.whatsappConversation.update({
    where: { id },
    data: { needsHuman: false },
  });
}

export interface AiLogFilter {
  status?: string;
  handoff?: boolean;
  dryRun?: boolean;
  conversationId?: string;
  page: number;
  limit: number;
}

function estimateCost(
  model: string,
  r: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  },
) {
  const p = MODEL_PRICING[model as AiModel];
  if (!p) return null;
  return (
    (r.inputTokens * p.input +
      r.outputTokens * p.output +
      r.cacheReadTokens * p.cacheRead +
      r.cacheWriteTokens * p.cacheWrite) /
    1_000_000
  );
}

export async function listAiLog(filter: AiLogFilter) {
  const where: Prisma.WhatsappAiReplyWhereInput = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.handoff !== undefined ? { handoff: filter.handoff } : {}),
    ...(filter.dryRun !== undefined ? { dryRun: filter.dryRun } : {}),
    ...(filter.conversationId ? { conversationId: filter.conversationId } : {}),
  };
  const [rows, total, totals] = await Promise.all([
    prisma.whatsappAiReply.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: { conversation: { select: { contactPhone: true, contactName: true } } },
    }),
    prisma.whatsappAiReply.count({ where }),
    prisma.whatsappAiReply.groupBy({
      by: ["model"],
      where: { ...where, createdAt: { gt: new Date(Date.now() - 30 * 86400000) } },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cacheReadTokens: true,
        cacheWriteTokens: true,
      },
      _count: { _all: true },
    }),
  ]);
  const last30DaysUsd = totals.reduce(
    (sum, t) =>
      sum +
      (estimateCost(t.model, {
        inputTokens: t._sum.inputTokens ?? 0,
        outputTokens: t._sum.outputTokens ?? 0,
        cacheReadTokens: t._sum.cacheReadTokens ?? 0,
        cacheWriteTokens: t._sum.cacheWriteTokens ?? 0,
      }) ?? 0),
    0,
  );
  return {
    total,
    last30Days: { replies: totals.reduce((n, t) => n + t._count._all, 0), costUsd: last30DaysUsd },
    entries: rows.map((r) => ({ ...r, costUsd: estimateCost(r.model, r) })),
  };
}

export async function getStats() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [conversations, handoffs, repliesToday, errorsToday, bookingsToday] = await Promise.all([
    prisma.whatsappConversation.count(),
    prisma.whatsappConversation.count({ where: { needsHuman: true } }),
    prisma.whatsappAiReply.count({ where: { createdAt: { gt: since }, dryRun: false } }),
    prisma.whatsappAiReply.count({ where: { createdAt: { gt: since }, status: "error" } }),
    prisma.whatsappBookingDraft.count({
      where: { confirmedAt: { gt: since }, status: "CONFIRMED" },
    }),
  ]);
  return { conversations, handoffs, repliesToday, errorsToday, bookingsToday };
}

/** Test/package picker for the concern-mapping editor. */
export async function searchCatalogueForAdmin(q: string) {
  const contains = { contains: q, mode: "insensitive" as const };
  const [tests, packages] = await Promise.all([
    prisma.test.findMany({
      where: { status: "Active", OR: [{ name: contains }, { shortName: contains }] },
      select: { id: true, name: true, shortName: true },
      orderBy: [{ bookedCount: "desc" }, { name: "asc" }],
      take: 15,
    }),
    prisma.package.findMany({
      where: { active: true, deletedAt: null, name: contains },
      select: { id: true, name: true },
      orderBy: [{ bookedCount: "desc" }, { name: "asc" }],
      take: 10,
    }),
  ]);
  return {
    tests: tests.map((t) => ({ id: t.id, name: t.name, code: t.shortName })),
    packages,
  };
}
