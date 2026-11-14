import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as branchUserService from "../services/branchUser.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query as Record<string, string | undefined>;

  const rows = await branchUserService.listBranchUsers(search?.trim() || undefined);

  res.status(200).json(ApiResponse.success("Branch users retrieved successfully", rows));
});
