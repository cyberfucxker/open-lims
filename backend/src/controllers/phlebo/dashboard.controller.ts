import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as dashboardService from "../../services/phlebo/dashboard.service";

function requirePhlebo(req: Request) {
  if (!req.phlebo) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.phlebo;
}

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const dashboard = await dashboardService.getDashboard(phlebo.id);
  res.status(200).json(AppApiResponse.success("OK", dashboard));
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const stats = await dashboardService.getStats(phlebo.id);
  res.status(200).json(AppApiResponse.success("OK", stats));
});
