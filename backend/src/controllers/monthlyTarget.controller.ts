import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as monthlyTargetService from "../services/monthlyTarget.service";
import type {
  ListMonthlyTargetsParams,
  UpsertMonthlyTargetInput,
} from "../types/monthlyTarget.types";

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as UpsertMonthlyTargetInput;

  const target = await monthlyTargetService.upsertTarget(values);

  res.status(200).json(ApiResponse.success("Monthly target saved successfully", target));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { marketingStaffId, month, year } = req.query as Record<string, string | undefined>;

  const params: ListMonthlyTargetsParams = {
    marketingStaffId,
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined,
  };

  const result = await monthlyTargetService.listTargets(params);

  res.status(200).json(ApiResponse.success("Monthly targets retrieved successfully", result));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { marketingStaffId, month, year } = req.params;

  const target = await monthlyTargetService.getTarget(
    marketingStaffId,
    Number(month),
    Number(year),
  );

  res.status(200).json(ApiResponse.success("Monthly target retrieved successfully", target));
});
