import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as referralIncentiveService from "../services/referralIncentive.service";
import type { ListReferralIncentivesParams } from "../types/referralIncentive.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { referralSourceId, incentiveStatus, dateFrom, dateTo, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListReferralIncentivesParams = {
    referralSourceId,
    incentiveStatus: incentiveStatus as ListReferralIncentivesParams["incentiveStatus"],
    dateFrom,
    dateTo,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await referralIncentiveService.listIncentives(params);

  res.status(200).json(ApiResponse.success("Referral incentives retrieved successfully", result));
});

export const listByReferralSource = asyncHandler(async (req: Request, res: Response) => {
  const rows = await referralIncentiveService.listByReferralSource(req.params.referralSourceId);

  res.status(200).json(ApiResponse.success("Referral incentives retrieved successfully", rows));
});

export const monthlySummary = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as Record<string, string>;

  const rows = await referralIncentiveService.getMonthlyIncentiveSummary(
    Number(month),
    Number(year),
  );

  res
    .status(200)
    .json(ApiResponse.success("Monthly incentive summary retrieved successfully", rows));
});
