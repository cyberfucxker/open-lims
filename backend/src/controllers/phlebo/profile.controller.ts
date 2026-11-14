import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { uploadedFileUrl } from "../../middleware/appUpload.middleware";
import * as profileService from "../../services/phlebo/profile.service";
import type {
  CompleteProfileInput,
  UpdateProfileInput,
} from "../../services/phlebo/profile.service";

function requirePhlebo(req: Request) {
  if (!req.phlebo) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.phlebo;
}

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);

  const profile = await profileService.getProfile(phlebo.id);

  res.status(200).json(AppApiResponse.success("OK", profile));
});

export const completeProfile = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const input = req.body as CompleteProfileInput;
  const profilePicUrl = req.file ? uploadedFileUrl(req.file.filename) : undefined;

  const user = await profileService.completeProfile(phlebo.id, input, profilePicUrl);

  res.status(200).json(AppApiResponse.success("Profile completed", { user }));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const input = req.body as UpdateProfileInput;
  const profilePicUrl = req.file ? uploadedFileUrl(req.file.filename) : undefined;

  const user = await profileService.updateProfile(phlebo.id, input, profilePicUrl);

  res.status(200).json(AppApiResponse.success("Profile updated", { user }));
});
