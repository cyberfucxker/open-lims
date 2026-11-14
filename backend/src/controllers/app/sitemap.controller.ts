import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as sitemapService from "../../services/app/sitemap.service";

export const getSitemapData = asyncHandler(async (_req: Request, res: Response) => {
  const data = await sitemapService.getSitemapData();

  res.status(200).json(AppApiResponse.success("Sitemap data fetched successfully", data));
});
