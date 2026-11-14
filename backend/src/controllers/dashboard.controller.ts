import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as dashboardService from "../services/dashboard.service";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query as Record<string, string | undefined>;

  const result = await dashboardService.getSummary({ dateFrom, dateTo });

  res.status(200).json(ApiResponse.success("Dashboard summary retrieved successfully", result));
});
