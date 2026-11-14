import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as appUserService from "../services/appUser.service";
import type {
  AdjustWalletInput,
  ListAppUsersParams,
  UpdateAppUserInput,
} from "../types/appUser.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    cityId,
    isActive,
    registeredFrom,
    registeredTo,
    minBalance,
    maxBalance,
    minOrderCount,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  const params: ListAppUsersParams = {
    search,
    cityId,
    isActive,
    registeredFrom,
    registeredTo,
    minBalance: minBalance ? Number(minBalance) : undefined,
    maxBalance: maxBalance ? Number(maxBalance) : undefined,
    minOrderCount: minOrderCount ? Number(minOrderCount) : undefined,
    sortBy: sortBy as ListAppUsersParams["sortBy"],
    sortDir: sortDir as ListAppUsersParams["sortDir"],
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await appUserService.listAppUsers(params);

  res.status(200).json(ApiResponse.success("Customers retrieved successfully", result));
});

export const getWalletStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await appUserService.getWalletStats();

  res.status(200).json(ApiResponse.success("Wallet stats retrieved successfully", stats));
});

export const adjustWallet = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }
  const input = req.body as AdjustWalletInput;

  const wallet = await appUserService.adjustWallet(req.params.id, input, req.user.id);

  res.status(200).json(ApiResponse.success("Wallet adjusted successfully", wallet));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const appUser = await appUserService.getAppUserDetail(req.params.id);

  res.status(200).json(ApiResponse.success("Customer retrieved successfully", appUser));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const appUser = await appUserService.setAppUserStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Customer status updated successfully", appUser));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as UpdateAppUserInput;

  const appUser = await appUserService.updateAppUser(req.params.id, values);

  res.status(200).json(ApiResponse.success("Customer updated successfully", appUser));
});
