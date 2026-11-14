import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as rechargeOfferService from "../services/rechargeOffer.service";
import type {
  ListRechargeOffersParams,
  RechargeOfferWriteData,
} from "../types/rechargeOffer.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { isActive, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListRechargeOffersParams = {
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await rechargeOfferService.listRechargeOffers(params);

  res.status(200).json(ApiResponse.success("Recharge offers retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const offer = await rechargeOfferService.getRechargeOffer(req.params.id);

  res.status(200).json(ApiResponse.success("Recharge offer retrieved successfully", offer));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { rechargeAmount, bonusAmount, isActive } = req.body as RechargeOfferWriteData;

  const offer = await rechargeOfferService.createRechargeOffer({
    rechargeAmount,
    bonusAmount,
    isActive,
  });

  res.status(201).json(ApiResponse.success("Recharge offer created successfully", offer));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { rechargeAmount, bonusAmount, isActive } = req.body as RechargeOfferWriteData;

  const offer = await rechargeOfferService.updateRechargeOffer(req.params.id, {
    rechargeAmount,
    bonusAmount,
    isActive,
  });

  res.status(200).json(ApiResponse.success("Recharge offer updated successfully", offer));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const offer = await rechargeOfferService.setRechargeOfferStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Recharge offer status updated successfully", offer));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await rechargeOfferService.deleteRechargeOffer(req.params.id);

  res.status(200).json(ApiResponse.success("Recharge offer deleted successfully"));
});
