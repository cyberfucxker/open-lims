import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as centerService from "../services/center.service";
import type { CenterWriteData, ListMasterParams } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, includeDeleted, sortBy, sortDir, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListMasterParams = {
    search,
    active,
    includeDeleted,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await centerService.listCenters(params);

  res.status(200).json(ApiResponse.success("Centers retrieved successfully", result));
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  const centers = await centerService.listActiveCenters();

  res.status(200).json(ApiResponse.success("Active centers retrieved successfully", centers));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const center = await centerService.getCenter(req.params.id);

  res.status(200).json(ApiResponse.success("Center retrieved successfully", center));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CenterWriteData;

  const center = await centerService.createCenter(values);

  res.status(201).json(ApiResponse.success("Center created successfully", center));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CenterWriteData;

  const center = await centerService.updateCenter(req.params.id, values);

  res.status(200).json(ApiResponse.success("Center updated successfully", center));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await centerService.deleteCenter(req.params.id);

  res.status(200).json(ApiResponse.success("Center deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const center = await centerService.restoreCenter(req.params.id);

  res.status(200).json(ApiResponse.success("Center restored successfully", center));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const center = await centerService.setCenterStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Center status updated successfully", center));
});
