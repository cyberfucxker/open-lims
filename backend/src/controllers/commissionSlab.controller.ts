import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as commissionSlabService from "../services/commissionSlab.service";
import type { CommissionSlabWriteData } from "../types/commissionSlab.types";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const result = await commissionSlabService.listCommissionSlabs();

  res.status(200).json(ApiResponse.success("Commission slabs retrieved successfully", result));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CommissionSlabWriteData;

  const slab = await commissionSlabService.createCommissionSlab(values);

  res.status(201).json(ApiResponse.success("Commission slab created successfully", slab));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CommissionSlabWriteData;

  const slab = await commissionSlabService.updateCommissionSlab(req.params.id, values);

  res.status(200).json(ApiResponse.success("Commission slab updated successfully", slab));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await commissionSlabService.deleteCommissionSlab(req.params.id);

  res.status(200).json(ApiResponse.success("Commission slab deleted successfully"));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const slab = await commissionSlabService.setCommissionSlabStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Commission slab status updated successfully", slab));
});
