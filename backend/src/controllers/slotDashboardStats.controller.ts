import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as slotDashboardStatsService from "../services/slotDashboardStats.service";

export const get = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await slotDashboardStatsService.getSlotDashboardStats();

  res.status(200).json(ApiResponse.success("Slot dashboard stats retrieved successfully", stats));
});
