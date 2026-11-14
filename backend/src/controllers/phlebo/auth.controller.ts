import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as authService from "../../services/phlebo/auth.service";

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

  const result = await authService.verifyLoginOtp(mobile, otp, fcmToken);

  res.status(200).json(AppApiResponse.success("Login successful", result));
});
