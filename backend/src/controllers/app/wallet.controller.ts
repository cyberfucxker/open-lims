import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as walletService from "../../services/app/wallet.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const getRechargeOffers = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const result = await walletService.listRechargeOffers(appUser.id);
  res.status(200).json(AppApiResponse.success("Recharge offers fetched successfully", result));
});

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const result = await walletService.getWalletBalance(appUser.id);
  res.status(200).json(AppApiResponse.success("Wallet balance fetched successfully", result));
});

export const initiateRecharge = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as walletService.InitiateRechargeInput;
  const result = await walletService.initiateRecharge(appUser.id, input);
  res.status(201).json(AppApiResponse.success("Recharge initiated", result));
});

export const verifyRecharge = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as walletService.VerifyRechargeInput;
  const result = await walletService.verifyRecharge(appUser.id, input);
  res.status(200).json(AppApiResponse.success("Recharge verified", result));
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { page, per_page: perPage } = req.query as { page?: number; per_page?: number };
  const result = await walletService.listWalletTransactions(appUser.id, page ?? 1, perPage ?? 20);
  res.status(200).json(AppApiResponse.success("Wallet transactions fetched successfully", result));
});
