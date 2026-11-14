import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as referralReportService from "../services/referralReport.service";
import type { ReferralRankBy } from "../types/referralReport.types";

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const result = await referralReportService.getDashboardSummary();

  res.status(200).json(ApiResponse.success("Referral dashboard retrieved successfully", result));
});

export const revenue = asyncHandler(async (req: Request, res: Response) => {
  const { months } = req.query as Record<string, string | undefined>;

  const result = await referralReportService.getMonthlyRevenueTrend(months ? Number(months) : 6);

  res
    .status(200)
    .json(ApiResponse.success("Referral revenue trend retrieved successfully", result));
});

export const performance = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query as Record<string, string | undefined>;

  const result = await referralReportService.getPerformance({ dateFrom, dateTo });

  res.status(200).json(ApiResponse.success("Referral performance retrieved successfully", result));
});

export const patientCount = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query as Record<string, string | undefined>;

  const result = await referralReportService.getPatientCount({ dateFrom, dateTo });

  res
    .status(200)
    .json(ApiResponse.success("Referral patient count retrieved successfully", result));
});

export const ranking = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, rankBy } = req.query as Record<string, string | undefined>;

  const result = await referralReportService.getRanking(
    { dateFrom, dateTo },
    rankBy as ReferralRankBy | undefined,
  );

  res.status(200).json(ApiResponse.success("Referral ranking retrieved successfully", result));
});

export const typeDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const result = await referralReportService.getTypeDistribution();

  res
    .status(200)
    .json(ApiResponse.success("Referral type distribution retrieved successfully", result));
});
