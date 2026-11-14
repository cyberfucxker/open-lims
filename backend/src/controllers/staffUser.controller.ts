import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import type { StaffModule } from "../middleware/staffModule.middleware";
import * as staffUserService from "../services/staffUser.service";
import { ApiResponse } from "../utils/ApiResponse";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const users = await staffUserService.listStaffUsers();
  res.status(200).json(ApiResponse.success("Team fetched successfully", users));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { username, fullName, password, staffModules } = req.body as {
    username: string;
    fullName: string;
    password: string;
    staffModules: StaffModule[];
  };
  const user = await staffUserService.createManager({ username, fullName, password, staffModules });
  res.status(201).json(ApiResponse.success("Manager created successfully", user));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, staffModules, isActive } = req.body as {
    fullName?: string;
    staffModules?: StaffModule[];
    isActive?: boolean;
  };
  const user = await staffUserService.updateManager(req.params.id, {
    fullName,
    staffModules,
    isActive,
  });
  res.status(200).json(ApiResponse.success("Manager updated successfully", user));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await staffUserService.resetManagerPassword(
    req.params.id,
    (req.body as { password: string }).password,
  );
  res.status(200).json(ApiResponse.success("Password reset successfully"));
});
