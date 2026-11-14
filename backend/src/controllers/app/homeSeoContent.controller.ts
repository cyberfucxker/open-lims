import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as homeSeoContentService from "../../services/homeSeoContent.service";

/** Patient-app twin of `homeSeoContent.controller.ts#get`. */
export const getHomeSeoContent = asyncHandler(async (_req: Request, res: Response) => {
  const content = await homeSeoContentService.getHomeSeoContent();

  res.status(200).json(AppApiResponse.success("Home SEO content fetched successfully", content));
});
