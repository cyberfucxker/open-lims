import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as serviceCenterService from "../services/serviceCenter.service";
import type {
  ListServiceCentersParams,
  ServiceCenterWriteData,
} from "../types/serviceCenter.types";

export const options = asyncHandler(async (_req: Request, res: Response) => {
  const centers = await serviceCenterService.listActiveServiceCenterOptions();

  res.status(200).json(ApiResponse.success("Service centers retrieved successfully", centers));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, isActive, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListServiceCentersParams = {
    search,
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await serviceCenterService.listServiceCenters(params);

  res.status(200).json(ApiResponse.success("Service centers retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const center = await serviceCenterService.getServiceCenter(req.params.id);

  res.status(200).json(ApiResponse.success("Service center retrieved successfully", center));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ServiceCenterWriteData;

  const center = await serviceCenterService.createServiceCenter(values);

  res.status(201).json(ApiResponse.success("Service center created successfully", center));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ServiceCenterWriteData;

  const center = await serviceCenterService.updateServiceCenter(req.params.id, values);

  res.status(200).json(ApiResponse.success("Service center updated successfully", center));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const center = await serviceCenterService.setServiceCenterStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Service center status updated successfully", center));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await serviceCenterService.deleteServiceCenter(req.params.id);

  res.status(200).json(ApiResponse.success("Service center deleted successfully"));
});
