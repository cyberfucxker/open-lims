import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as profileService from "../../services/app/profile.service";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }

  const profile = await profileService.getProfile(req.appUser.id);

  res.status(200).json(AppApiResponse.success("Profile fetched successfully", profile));
});
