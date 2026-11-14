import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as authService from "../services/auth.service";
import * as authRepository from "../repositories/auth.repository";

function requestContext(req: Request) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
  };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };

  const result = await authService.login(username, password, requestContext(req));

  res.status(200).json(ApiResponse.success("Login successful", result));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: providedToken } = req.body as { refreshToken: string };

  const tokens = await authService.refreshAccessToken(providedToken, requestContext(req));

  res.status(200).json(ApiResponse.success("Token refreshed successfully", tokens));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: providedToken } = req.body as { refreshToken: string };

  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  await authService.logout(providedToken, req.user.id);

  res.status(200).json(ApiResponse.success("Logged out successfully"));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.body as { username: string };

  const result = await authService.forgotPassword(username);

  res.status(200).json(ApiResponse.success(result.message, { resetToken: result.resetToken }));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  await authService.resetPassword(token, newPassword);

  res.status(200).json(ApiResponse.success("Password has been reset successfully"));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  const tokens = await authService.changePassword(
    req.user.id,
    currentPassword,
    newPassword,
    requestContext(req),
  );

  res.status(200).json(ApiResponse.success("Password changed successfully", tokens));
});

export const changeUsername = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newUsername } = req.body as {
    currentPassword: string;
    newUsername: string;
  };

  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  const result = await authService.changeUsername(
    req.user.id,
    currentPassword,
    newUsername,
    requestContext(req),
  );

  res.status(200).json(ApiResponse.success("Username changed successfully", result));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  const user = await authRepository.findUserById(req.user.id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res
    .status(200)
    .json(
      ApiResponse.success("Current user retrieved successfully", authService.toAuthUserDto(user)),
    );
});
