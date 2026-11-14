import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

/** Superadmin → WhatsApp Assistant. Keys are write-only: the API only ever
 *  returns them masked ("••••abcd"). */

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await httpClient.get<ApiResponseBody<T>>(url, { params });
  return response.data.data as T;
}

async function write<T>(
  method: "post" | "put" | "patch" | "delete",
  url: string,
  body?: unknown,
): Promise<T> {
  const response =
    method === "delete"
      ? await httpClient.delete<ApiResponseBody<T>>(url, { suppressErrorToast: true })
      : await httpClient[method]<ApiResponseBody<T>>(url, body, { suppressErrorToast: true });
  return response.data.data as T;
}

// ─── Settings ──────────────────────────────────────────────────────────────

export interface WhatsappSettingsDto {
  enabled: boolean;
  anthropicKey: string | null;
  model: string;
  models: string[];
  maxRepliesPerHour: number;
  voiceEnabled: boolean;
  sttProvider: "groq" | "openai";
  sttKey: string | null;
  brandName: string;
  businessInstructions: string;
  encryptionKeyConfigured: boolean;
  updatedAt: string;
}

export interface WhatsappSettingsWrite {
  enabled?: boolean;
  /** Omit to keep the stored key; "" clears it. */
  anthropicKey?: string;
  model?: string;
  maxRepliesPerHour?: number;
  voiceEnabled?: boolean;
  sttProvider?: "groq" | "openai";
  sttKey?: string;
  brandName?: string;
  businessInstructions?: string;
}

export const fetchWhatsappSettings = () => get<WhatsappSettingsDto>("/whatsapp/settings");
export const updateWhatsappSettings = (values: WhatsappSettingsWrite) =>
  write<WhatsappSettingsDto>("put", "/whatsapp/settings", values);

// ─── Accounts ──────────────────────────────────────────────────────────────

export interface WhatsappAccountDto {
  id: string;
  label: string;
  phoneNumberId: string;
  wabaId: string | null;
  displayPhone: string | null;
  accessToken: string | null;
  appSecret: string | null;
  verifyToken: string;
  isActive: boolean;
  lastWebhookAt: string | null;
  webhookUrl: string | null;
  webhookPath: string;
}

export interface WhatsappAccountWrite {
  label?: string;
  phoneNumberId?: string;
  wabaId?: string;
  displayPhone?: string;
  accessToken?: string;
  appSecret?: string;
  isActive?: boolean;
}

export const fetchWhatsappAccounts = () => get<WhatsappAccountDto[]>("/whatsapp/accounts");
export const createWhatsappAccount = (values: WhatsappAccountWrite) =>
  write<WhatsappAccountDto>("post", "/whatsapp/accounts", values);
export const updateWhatsappAccount = (id: string, values: WhatsappAccountWrite) =>
  write<WhatsappAccountDto>("patch", `/whatsapp/accounts/${id}`, values);
export const regenerateVerifyToken = (id: string) =>
  write<WhatsappAccountDto>("post", `/whatsapp/accounts/${id}/verify-token`);
export const testWhatsappAccount = (id: string) =>
  write<{ display_phone_number?: string; verified_name?: string; quality_rating?: string }>(
    "post",
    `/whatsapp/accounts/${id}/test`,
  );

// ─── Knowledge base / concern mapping ─────────────────────────────────────

export interface KnowledgeEntryDto {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type KnowledgeWrite = Partial<
  Pick<KnowledgeEntryDto, "title" | "body" | "isActive" | "sortOrder">
>;

export const fetchKnowledge = () => get<KnowledgeEntryDto[]>("/whatsapp/knowledge");
export const createKnowledge = (values: KnowledgeWrite) =>
  write<KnowledgeEntryDto>("post", "/whatsapp/knowledge", values);
export const updateKnowledge = (id: string, values: KnowledgeWrite) =>
  write<KnowledgeEntryDto>("patch", `/whatsapp/knowledge/${id}`, values);
export const deleteKnowledge = (id: string) => write<null>("delete", `/whatsapp/knowledge/${id}`);

export interface CatalogueRef {
  id: string;
  name: string;
}

export interface ConcernMappingDto {
  id: string;
  concern: string;
  keywords: string[];
  testIds: string[];
  packageIds: string[];
  tests: CatalogueRef[];
  packages: CatalogueRef[];
  notes: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface ConcernMappingWrite {
  concern?: string;
  keywords?: string[];
  testIds?: string[];
  packageIds?: string[];
  notes?: string | null;
  isActive?: boolean;
}

export const fetchMappings = () => get<ConcernMappingDto[]>("/whatsapp/mappings");
export const createMapping = (values: ConcernMappingWrite) =>
  write<ConcernMappingDto>("post", "/whatsapp/mappings", values);
export const updateMapping = (id: string, values: ConcernMappingWrite) =>
  write<ConcernMappingDto>("patch", `/whatsapp/mappings/${id}`, values);
export const deleteMapping = (id: string) => write<null>("delete", `/whatsapp/mappings/${id}`);
export const searchCatalogue = (q: string) =>
  get<{ tests: Array<CatalogueRef & { code: string }>; packages: CatalogueRef[] }>(
    "/whatsapp/catalogue-search",
    { q },
  );

// ─── Try it ────────────────────────────────────────────────────────────────

export interface ToolRunDto {
  name: string;
  input: unknown;
  ok: boolean;
  result: string;
}

export interface TryItResult {
  routedByCode: string | null;
  reply: string | null;
  toolRuns: ToolRunDto[];
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number } | null;
  costUsd: number;
}

export const tryWhatsappAssistant = (values: {
  message: string;
  phone?: string;
  history?: Array<{ role: "user" | "assistant"; text: string }>;
}) => write<TryItResult>("post", "/whatsapp/try", values);

// ─── Conversations / handoff / log ─────────────────────────────────────────

export interface ConversationSummaryDto {
  id: string;
  contactPhone: string;
  contactName: string | null;
  account: string;
  lastMessage: { body: string | null; author: string; sentAt: string } | null;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  unreadCount: number;
  humanTakeover: boolean;
  needsHuman: boolean;
  handoffReason: string | null;
  handoffSummary: string | null;
  handoffAt: string | null;
}

export interface ChatMessageDto {
  id: string;
  direction: "IN" | "OUT";
  author: "CUSTOMER" | "AI" | "STAFF" | "SYSTEM" | "TEMPLATE";
  type: string;
  body: string | null;
  status: string;
  error: string | null;
  sentAt: string;
}

export interface ConversationDetailDto extends Omit<
  ConversationSummaryDto,
  "account" | "lastMessage"
> {
  windowOpen: boolean;
  account: { label: string; displayPhone: string | null };
  appUser: { id: string; name: string | null; mobile: string } | null;
  messages: ChatMessageDto[];
  bookings: Array<{
    draftId: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    order: { id: string; orderNumber: string; status: string; totalPayable: number } | null;
  }>;
}

export interface WhatsappStatsDto {
  conversations: number;
  handoffs: number;
  repliesToday: number;
  errorsToday: number;
  bookingsToday: number;
}

export const fetchWhatsappStats = () => get<WhatsappStatsDto>("/whatsapp/stats");
export const fetchConversations = (params: {
  view?: string;
  search?: string;
  page?: number;
  limit?: number;
}) =>
  get<{ total: number; conversations: ConversationSummaryDto[] }>(
    "/whatsapp/conversations",
    params,
  );
export const fetchConversation = (id: string) =>
  get<ConversationDetailDto>(`/whatsapp/conversations/${id}`);
export const sendStaffReply = (id: string, body: string) =>
  write<ChatMessageDto>("post", `/whatsapp/conversations/${id}/reply`, { body });
export const setTakeover = (id: string, humanTakeover: boolean) =>
  write<unknown>("post", `/whatsapp/conversations/${id}/takeover`, { humanTakeover });
export const resolveHandoff = (id: string) =>
  write<unknown>("post", `/whatsapp/conversations/${id}/resolve-handoff`);

export interface AiLogEntryDto {
  id: string;
  conversationId: string | null;
  conversation: { contactPhone: string; contactName: string | null } | null;
  question: string | null;
  answer: string | null;
  toolCalls: ToolRunDto[] | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number | null;
  status: string;
  error: string | null;
  handoff: boolean;
  dryRun: boolean;
  createdAt: string;
}

export const fetchAiLog = (params: {
  status?: string;
  handoff?: boolean;
  dryRun?: boolean;
  page?: number;
  limit?: number;
}) =>
  get<{
    total: number;
    last30Days: { replies: number; costUsd: number };
    entries: AiLogEntryDto[];
  }>("/whatsapp/ai-log", params);

// ─── Follow-up ("repeat this test") reminders ──────────────────────────────

export type FollowUpStatus =
  "SCHEDULED" | "SENT" | "SKIPPED_REBOOKED" | "SKIPPED" | "FAILED" | "BOOKED";

export interface FollowUpReminderDto {
  id: string;
  itemName: string;
  itemType: "TEST" | "PACKAGE";
  dueDate: string;
  status: FollowUpStatus;
  templateName: string | null;
  pushSent: boolean;
  whatsappStatus: string | null;
  error: string | null;
  sentAt: string | null;
  customer: string;
  mobile: string;
  orderNumber: string;
  bookedOrderId: string | null;
}

export const fetchFollowUps = (params: { status?: string; page?: number; limit?: number }) =>
  get<{
    total: number;
    counts: Partial<Record<FollowUpStatus, number>>;
    reminders: FollowUpReminderDto[];
  }>("/whatsapp/follow-ups", params);
