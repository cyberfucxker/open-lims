import { randomBytes } from "crypto";
import type { WhatsappAccount, WhatsappAiSettings } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { decryptOptional, encryptSecret, maskSecret } from "../../utils/crypto.util";
import { isSttProvider } from "./transcription.service";

/** Models selectable in Superadmin. Haiku is the default: cheapest, and the
 *  job (short WhatsApp turns over a handful of tools) does not need more. */
export const AI_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"] as const;
export type AiModel = (typeof AI_MODELS)[number];

/** USD per million tokens — input, output, cache read, cache write (5m).
 *  Only used for the cost estimate column of the AI log. */
export const MODEL_PRICING: Record<
  AiModel,
  { input: number; output: number; cacheRead: number; cacheWrite: number }
> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
};

export async function getSettingsRow(): Promise<WhatsappAiSettings> {
  return prisma.whatsappAiSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export interface RuntimeSettings {
  enabled: boolean;
  anthropicKey: string | null;
  model: AiModel;
  maxRepliesPerHour: number;
  voiceEnabled: boolean;
  sttProvider: "groq" | "openai";
  sttKey: string | null;
  brandName: string;
  businessInstructions: string;
}

/** Server-side only — holds decrypted keys. */
export async function getRuntimeSettings(): Promise<RuntimeSettings> {
  const row = await getSettingsRow();
  return {
    enabled: row.enabled,
    anthropicKey: decryptOptional(row.anthropicKeyEnc),
    model: (AI_MODELS as readonly string[]).includes(row.model)
      ? (row.model as AiModel)
      : "claude-haiku-5-5",
    maxRepliesPerHour: row.maxRepliesPerHour,
    voiceEnabled: row.voiceEnabled,
    sttProvider: isSttProvider(row.sttProvider) ? row.sttProvider : "groq",
    sttKey: decryptOptional(row.sttKeyEnc),
    brandName: row.brandName,
    businessInstructions: row.businessInstructions,
  };
}

function safeMask(ciphertext: string | null): string | null {
  try {
    return maskSecret(decryptOptional(ciphertext));
  } catch {
    return "(unreadable — re-enter)";
  }
}

/** What the browser gets — keys only as "••••abcd". */
export async function getSettingsForAdmin() {
  const row = await getSettingsRow();
  return {
    enabled: row.enabled,
    anthropicKey: safeMask(row.anthropicKeyEnc),
    model: row.model,
    models: AI_MODELS,
    maxRepliesPerHour: row.maxRepliesPerHour,
    voiceEnabled: row.voiceEnabled,
    sttProvider: row.sttProvider,
    sttKey: safeMask(row.sttKeyEnc),
    brandName: row.brandName,
    businessInstructions: row.businessInstructions,
    encryptionKeyConfigured: !!env.WHATSAPP_ENCRYPTION_KEY,
    updatedAt: row.updatedAt,
  };
}

export interface SettingsUpdate {
  enabled?: boolean;
  /** New key; omit to keep the stored one, "" to clear it. */
  anthropicKey?: string;
  model?: string;
  maxRepliesPerHour?: number;
  voiceEnabled?: boolean;
  sttProvider?: string;
  sttKey?: string;
  brandName?: string;
  businessInstructions?: string;
}

function secretField(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value.trim() ? encryptSecret(value.trim()) : null;
}

export async function updateSettings(input: SettingsUpdate) {
  if (input.model !== undefined && !(AI_MODELS as readonly string[]).includes(input.model)) {
    throw ApiError.badRequest("Unknown model");
  }
  if (input.sttProvider !== undefined && !isSttProvider(input.sttProvider)) {
    throw ApiError.badRequest("Unknown speech-to-text provider");
  }
  await getSettingsRow();
  await prisma.whatsappAiSettings.update({
    where: { id: "default" },
    data: {
      enabled: input.enabled,
      anthropicKeyEnc: secretField(input.anthropicKey),
      model: input.model,
      maxRepliesPerHour: input.maxRepliesPerHour,
      voiceEnabled: input.voiceEnabled,
      sttProvider: input.sttProvider,
      sttKeyEnc: secretField(input.sttKey),
      brandName: input.brandName,
      businessInstructions: input.businessInstructions,
    },
  });
  return getSettingsForAdmin();
}

// ─── WhatsApp accounts (phone numbers) ─────────────────────────────────────

export function webhookUrlFor(accountId: string): string | null {
  return env.PUBLIC_API_BASE_URL
    ? `${env.PUBLIC_API_BASE_URL.replace(/\/$/, "")}/api/webhook/whatsapp/${accountId}`
    : null;
}

function toAdminAccount(account: WhatsappAccount) {
  return {
    id: account.id,
    label: account.label,
    phoneNumberId: account.phoneNumberId,
    wabaId: account.wabaId,
    displayPhone: account.displayPhone,
    accessToken: safeMask(account.accessTokenEnc),
    appSecret: safeMask(account.appSecretEnc),
    verifyToken: account.verifyToken,
    isActive: account.isActive,
    lastWebhookAt: account.lastWebhookAt,
    webhookUrl: webhookUrlFor(account.id),
    webhookPath: `/api/webhook/whatsapp/${account.id}`,
  };
}

export async function listAccounts() {
  const accounts = await prisma.whatsappAccount.findMany({ orderBy: { createdAt: "asc" } });
  return accounts.map(toAdminAccount);
}

export interface AccountInput {
  label?: string;
  phoneNumberId?: string;
  wabaId?: string;
  displayPhone?: string;
  accessToken?: string;
  appSecret?: string;
  isActive?: boolean;
}

export async function createAccount(input: AccountInput) {
  if (!input.phoneNumberId?.trim()) {
    throw ApiError.badRequest("Phone number id is required");
  }
  const exists = await prisma.whatsappAccount.findUnique({
    where: { phoneNumberId: input.phoneNumberId.trim() },
  });
  if (exists) {
    throw ApiError.conflict("This phone number id is already connected");
  }
  const account = await prisma.whatsappAccount.create({
    data: {
      label: input.label?.trim() || "Main",
      phoneNumberId: input.phoneNumberId.trim(),
      wabaId: input.wabaId?.trim() || null,
      displayPhone: input.displayPhone?.trim() || null,
      accessTokenEnc: secretField(input.accessToken) ?? null,
      appSecretEnc: secretField(input.appSecret) ?? null,
      verifyToken: randomBytes(18).toString("base64url"),
      isActive: input.isActive ?? true,
    },
  });
  return toAdminAccount(account);
}

export async function updateAccount(id: string, input: AccountInput) {
  const account = await prisma.whatsappAccount.findUnique({ where: { id } });
  if (!account) {
    throw ApiError.notFound("WhatsApp number not found");
  }
  const updated = await prisma.whatsappAccount.update({
    where: { id },
    data: {
      label: input.label?.trim() || undefined,
      phoneNumberId: input.phoneNumberId?.trim() || undefined,
      wabaId: input.wabaId === undefined ? undefined : input.wabaId.trim() || null,
      displayPhone:
        input.displayPhone === undefined ? undefined : input.displayPhone.trim() || null,
      accessTokenEnc: secretField(input.accessToken),
      appSecretEnc: secretField(input.appSecret),
      isActive: input.isActive,
    },
  });
  return toAdminAccount(updated);
}

export async function regenerateVerifyToken(id: string) {
  const updated = await prisma.whatsappAccount.update({
    where: { id },
    data: { verifyToken: randomBytes(18).toString("base64url") },
  });
  return toAdminAccount(updated);
}

export async function getAccountOrThrow(id: string): Promise<WhatsappAccount> {
  const account = await prisma.whatsappAccount.findUnique({ where: { id } });
  if (!account) {
    throw ApiError.notFound("WhatsApp number not found");
  }
  return account;
}

// ─── Knowledge base ────────────────────────────────────────────────────────

export interface KnowledgeInput {
  title?: string;
  body?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export function listKnowledge() {
  return prisma.whatsappKnowledgeEntry.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
}

export function createKnowledge(input: KnowledgeInput) {
  if (!input.title?.trim() || !input.body?.trim()) {
    throw ApiError.badRequest("Title and text are required");
  }
  return prisma.whatsappKnowledgeEntry.create({
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      isActive: input.isActive ?? false,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateKnowledge(id: string, input: KnowledgeInput) {
  await prisma.whatsappKnowledgeEntry.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw ApiError.notFound("Entry not found");
  });
  return prisma.whatsappKnowledgeEntry.update({
    where: { id },
    data: {
      title: input.title?.trim() || undefined,
      body: input.body?.trim() || undefined,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function deleteKnowledge(id: string) {
  await prisma.whatsappKnowledgeEntry.delete({ where: { id } }).catch(() => {
    throw ApiError.notFound("Entry not found");
  });
}

// ─── Concern → test mapping ────────────────────────────────────────────────

export interface MappingInput {
  concern?: string;
  keywords?: string[];
  testIds?: string[];
  packageIds?: string[];
  notes?: string | null;
  isActive?: boolean;
}

async function assertCatalogueIds(testIds: string[], packageIds: string[]) {
  const [tests, packages] = await Promise.all([
    prisma.test.count({ where: { id: { in: testIds } } }),
    prisma.package.count({ where: { id: { in: packageIds } } }),
  ]);
  if (tests !== new Set(testIds).size || packages !== new Set(packageIds).size) {
    throw ApiError.badRequest("One or more selected tests/packages no longer exist");
  }
}

function normaliseKeywords(keywords: string[] | undefined): string[] | undefined {
  if (!keywords) return undefined;
  return [...new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))];
}

export async function listMappings() {
  const mappings = await prisma.concernTestMapping.findMany({ orderBy: { concern: "asc" } });
  const testIds = [...new Set(mappings.flatMap((m) => m.testIds))];
  const packageIds = [...new Set(mappings.flatMap((m) => m.packageIds))];
  const [tests, packages] = await Promise.all([
    prisma.test.findMany({ where: { id: { in: testIds } }, select: { id: true, name: true } }),
    prisma.package.findMany({
      where: { id: { in: packageIds } },
      select: { id: true, name: true },
    }),
  ]);
  const testName = new Map(tests.map((t) => [t.id, t.name]));
  const packageName = new Map(packages.map((p) => [p.id, p.name]));
  return mappings.map((m) => ({
    ...m,
    tests: m.testIds.map((id) => ({ id, name: testName.get(id) ?? "(deleted)" })),
    packages: m.packageIds.map((id) => ({ id, name: packageName.get(id) ?? "(deleted)" })),
  }));
}

export async function createMapping(input: MappingInput) {
  const testIds = input.testIds ?? [];
  const packageIds = input.packageIds ?? [];
  if (!input.concern?.trim()) {
    throw ApiError.badRequest("Concern is required");
  }
  if (testIds.length + packageIds.length === 0) {
    throw ApiError.badRequest("Pick at least one test or package");
  }
  await assertCatalogueIds(testIds, packageIds);
  return prisma.concernTestMapping.create({
    data: {
      concern: input.concern.trim(),
      keywords: normaliseKeywords(input.keywords) ?? [],
      testIds,
      packageIds,
      notes: input.notes?.trim() || null,
      isActive: input.isActive ?? false,
    },
  });
}

export async function updateMapping(id: string, input: MappingInput) {
  const existing = await prisma.concernTestMapping.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Mapping not found");
  }
  const testIds = input.testIds ?? existing.testIds;
  const packageIds = input.packageIds ?? existing.packageIds;
  if (testIds.length + packageIds.length === 0) {
    throw ApiError.badRequest("Pick at least one test or package");
  }
  await assertCatalogueIds(testIds, packageIds);
  return prisma.concernTestMapping.update({
    where: { id },
    data: {
      concern: input.concern?.trim() || undefined,
      keywords: normaliseKeywords(input.keywords),
      testIds,
      packageIds,
      notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
      isActive: input.isActive,
    },
  });
}

export async function deleteMapping(id: string) {
  await prisma.concernTestMapping.delete({ where: { id } }).catch(() => {
    throw ApiError.notFound("Mapping not found");
  });
}
