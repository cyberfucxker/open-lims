import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as dashboardSummaryService from "../services/dashboardSummary.service";
import type { DashboardPeriod } from "../types/dashboardSummary.types";

const VALID_PERIODS: DashboardPeriod[] = ["today", "week", "month", "all"];

export const get = asyncHandler(async (req: Request, res: Response) => {
  const { period } = req.query as { period?: string };
  const resolvedPeriod: DashboardPeriod = VALID_PERIODS.includes(period as DashboardPeriod)
    ? (period as DashboardPeriod)
    : "month";

  const result = await dashboardSummaryService.getDashboardSummary(resolvedPeriod);

  res.status(200).json(ApiResponse.success("Dashboard summary retrieved successfully", result));
});
