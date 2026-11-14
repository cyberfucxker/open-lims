import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as stateService from "../services/state.service";
import type { StateWriteData } from "../types/master.types";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const states = await stateService.listStates();

  res.status(200).json(ApiResponse.success("States retrieved successfully", states));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const state = await stateService.createState(req.body as StateWriteData);

  res.status(201).json(ApiResponse.success("State created successfully", state));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const state = await stateService.updateState(req.params.id, req.body as StateWriteData);

  res.status(200).json(ApiResponse.success("State updated successfully", state));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await stateService.deleteState(req.params.id);

  res.status(200).json(ApiResponse.success("State deleted successfully", null));
});
