import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as referralSettlementService from "../services/referralSettlement.service";
import { generateReferralSettlementExcel } from "../services/excelExport.service";
import {
  generateReferralSettlementListPdf,
  generateSingleReferralSettlementPdf,
} from "../services/referralPdf.service";
import type {
  GenerateSettlementInput,
  ListReferralSettlementsParams,
} from "../types/referralSettlement.types";

function parseListParams(req: Request): ListReferralSettlementsParams {
  const {
    referralSourceId,
    settlementStatus,
    dateFrom,
    dateTo,
    search,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  return {
    referralSourceId,
    settlementStatus: settlementStatus as ListReferralSettlementsParams["settlementStatus"],
    dateFrom,
    dateTo,
    search,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await referralSettlementService.listSettlements(parseListParams(req));

  res.status(200).json(ApiResponse.success("Referral settlements retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const settlement = await referralSettlementService.getSettlement(req.params.id);

  res
    .status(200)
    .json(ApiResponse.success("Referral settlement retrieved successfully", settlement));
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as GenerateSettlementInput;

  const settlement = await referralSettlementService.generateSettlement(values);

  res
    .status(201)
    .json(ApiResponse.success("Referral settlement generated successfully", settlement));
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const settlement = await referralSettlementService.markPaid(req.params.id);

  res.status(200).json(ApiResponse.success("Referral settlement marked as paid", settlement));
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const settlement = await referralSettlementService.cancelSettlement(req.params.id);

  res
    .status(200)
    .json(ApiResponse.success("Referral settlement cancelled successfully", settlement));
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const rows = await referralSettlementService.listAllForExport(parseListParams(req));
  const buffer = await generateReferralSettlementExcel(rows);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="referral-settlements.xlsx"');
  res.send(buffer);
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const rows = await referralSettlementService.listAllForExport(parseListParams(req));
  const buffer = await generateReferralSettlementListPdf(rows);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="referral-settlements.pdf"');
  res.send(buffer);
});

export const exportSinglePdf = asyncHandler(async (req: Request, res: Response) => {
  const settlement = await referralSettlementService.getSettlement(req.params.id);
  const buffer = await generateSingleReferralSettlementPdf(settlement);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="referral-settlement-${settlement.referralSourceName.replace(/\s+/g, "-")}.pdf"`,
  );
  res.send(buffer);
});
