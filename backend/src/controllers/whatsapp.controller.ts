import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as settingsService from "../services/whatsapp/settings.service";
import * as adminService from "../services/whatsapp/admin.service";
import * as conversationService from "../services/whatsapp/conversation.service";
import { fetchPhoneNumberInfo, graphError } from "../services/whatsapp/cloudApi.client";
import { listFollowUps } from "../services/whatsapp/followUp.service";

function page(req: Request) {
  return {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 25,
  };
}

// ─── Settings ──────────────────────────────────────────────────────────────

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(200)
    .json(ApiResponse.success("Settings retrieved", await settingsService.getSettingsForAdmin()));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = await settingsService.updateSettings(req.body as settingsService.SettingsUpdate);
  res.status(200).json(ApiResponse.success("Settings saved", data));
});

// ─── Accounts ──────────────────────────────────────────────────────────────

export const listAccounts = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(200)
    .json(ApiResponse.success("Numbers retrieved", await settingsService.listAccounts()));
});

export const createAccount = asyncHandler(async (req: Request, res: Response) => {
  const data = await settingsService.createAccount(req.body as settingsService.AccountInput);
  res.status(201).json(ApiResponse.success("Number connected", data));
});

export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const data = await settingsService.updateAccount(
    req.params.id,
    req.body as settingsService.AccountInput,
  );
  res.status(200).json(ApiResponse.success("Number saved", data));
});

export const regenerateVerifyToken = asyncHandler(async (req: Request, res: Response) => {
  const data = await settingsService.regenerateVerifyToken(req.params.id);
  res.status(200).json(ApiResponse.success("Verify token regenerated", data));
});

export const testAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await settingsService.getAccountOrThrow(req.params.id);
  try {
    const info = await fetchPhoneNumberInfo(account);
    res.status(200).json(ApiResponse.success("Connected to Meta", info));
  } catch (error) {
    throw ApiError.badRequest(`Meta rejected the request: ${graphError(error)}`);
  }
});

// ─── Knowledge base ────────────────────────────────────────────────────────

export const listKnowledge = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(200)
    .json(ApiResponse.success("Entries retrieved", await settingsService.listKnowledge()));
});

export const createKnowledge = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(201)
    .json(ApiResponse.success("Entry created", await settingsService.createKnowledge(req.body)));
});

export const updateKnowledge = asyncHandler(async (req: Request, res: Response) => {
  const data = await settingsService.updateKnowledge(req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Entry saved", data));
});

export const deleteKnowledge = asyncHandler(async (req: Request, res: Response) => {
  await settingsService.deleteKnowledge(req.params.id);
  res.status(200).json(ApiResponse.success("Entry deleted"));
});

// ─── Concern mapping ───────────────────────────────────────────────────────

export const listMappings = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(200)
    .json(ApiResponse.success("Mappings retrieved", await settingsService.listMappings()));
});

export const createMapping = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(201)
    .json(ApiResponse.success("Mapping created", await settingsService.createMapping(req.body)));
});

export const updateMapping = asyncHandler(async (req: Request, res: Response) => {
  const data = await settingsService.updateMapping(req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Mapping saved", data));
});

export const deleteMapping = asyncHandler(async (req: Request, res: Response) => {
  await settingsService.deleteMapping(req.params.id);
  res.status(200).json(ApiResponse.success("Mapping deleted"));
});

export const searchCatalogue = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  const data =
    q.length >= 2 ? await adminService.searchCatalogueForAdmin(q) : { tests: [], packages: [] };
  res.status(200).json(ApiResponse.success("Results", data));
});

// ─── Try it ────────────────────────────────────────────────────────────────

export const tryIt = asyncHandler(async (req: Request, res: Response) => {
  const data = await conversationService.tryIt(req.body as { message: string; phone?: string });
  res.status(200).json(ApiResponse.success("Dry run complete — nothing was sent or booked", data));
});

// ─── Conversations / handoff / log ─────────────────────────────────────────

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(ApiResponse.success("Stats", await adminService.getStats()));
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.listConversations({
    ...page(req),
    view: req.query.view as adminService.ConversationFilter["view"],
    search: (req.query.search as string | undefined) || undefined,
  });
  res.status(200).json(ApiResponse.success("Conversations retrieved", data));
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(200)
    .json(
      ApiResponse.success(
        "Conversation retrieved",
        await adminService.getConversation(req.params.id),
      ),
    );
});

export const staffReply = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized("Authentication required");
  const sent = await conversationService.sendStaffReply(
    req.params.id,
    req.user.id,
    String(req.body.body),
  );
  res
    .status(201)
    .json(ApiResponse.success("Message sent — the assistant is paused for this chat", sent));
});

export const setTakeover = asyncHandler(async (req: Request, res: Response) => {
  const data = await conversationService.setTakeover(
    req.params.id,
    Boolean(req.body.humanTakeover),
  );
  res
    .status(200)
    .json(ApiResponse.success(data.humanTakeover ? "Assistant paused" : "Assistant resumed", data));
});

export const resolveHandoff = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(200)
    .json(
      ApiResponse.success("Handoff resolved", await adminService.resolveHandoff(req.params.id)),
    );
});

export const aiLog = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.listAiLog({
    ...page(req),
    status: (req.query.status as string | undefined) || undefined,
    handoff:
      req.query.handoff === undefined ? undefined : (req.query.handoff as unknown as boolean),
    dryRun: req.query.dryRun === undefined ? undefined : (req.query.dryRun as unknown as boolean),
  });
  res.status(200).json(ApiResponse.success("AI log retrieved", data));
});

export const followUps = asyncHandler(async (req: Request, res: Response) => {
  const data = await listFollowUps({
    ...page(req),
    status: (req.query.status as string | undefined) || undefined,
  });
  res.status(200).json(ApiResponse.success("Follow-up reminders retrieved", data));
});
