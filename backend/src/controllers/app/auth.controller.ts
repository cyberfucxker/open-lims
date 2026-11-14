import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { uploadedFileUrl } from "../../middleware/appUpload.middleware";
import { resolvePlatform } from "../../utils/platform.util";
import * as authService from "../../services/app/auth.service";
import type { CompleteProfileInput } from "../../services/app/auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body as { mobile: string };

  const devFields = await authService.sendLoginOtp(mobile);

  res
    .status(200)
    .json(
      AppApiResponse.success(
        "OTP sent successfully",
        Object.keys(devFields).length ? devFields : null,
      ),
    );
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp, fcmToken } = req.body as { mobile: string; otp: string; fcmToken?: string };

  const result = await authService.verifyLoginOtp(mobile, otp, resolvePlatform(req), fcmToken);

  res.status(200).json(AppApiResponse.success("OTP verified successfully", result));
});

export const completeProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }

  const input = req.body as CompleteProfileInput;
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const profilePicUrl = files?.profile_photo?.[0]
    ? uploadedFileUrl(files.profile_photo[0].filename)
    : undefined;
  const verificationDocumentUrl = files?.verification_document?.[0]
    ? uploadedFileUrl(files.verification_document[0].filename)
    : undefined;

  await authService.completeProfile(req.appUser.id, input, {
    profilePicUrl,
    verificationDocumentUrl,
  });

  res.status(200).json(AppApiResponse.success("Profile completed successfully"));
});
