import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as contentService from "../../services/phlebo/content.service";

export const getTermsAndConditions = asyncHandler(async (_req: Request, res: Response) => {
  const page = await contentService.getTermsAndConditions();
  res.status(200).json(AppApiResponse.success("OK", page));
});

export const getPrivacyPolicy = asyncHandler(async (_req: Request, res: Response) => {
  const page = await contentService.getPrivacyPolicy();
  res.status(200).json(AppApiResponse.success("OK", page));
});

export const getHelpSupport = asyncHandler(async (_req: Request, res: Response) => {
  const help = await contentService.getHelpSupport();
  res.status(200).json(AppApiResponse.success("OK", help));
});
