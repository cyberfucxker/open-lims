import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as roleService from "../services/role.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await roleService.listRoles();

  res.status(200).json(ApiResponse.success("Roles retrieved successfully", roles));
});
