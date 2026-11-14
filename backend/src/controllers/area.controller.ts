import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as areaService from "../services/area.service";
import type { AreaWriteData, ListAreasParams } from "../types/area.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { cityId, search, isActive, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListAreasParams = {
    cityId,
    search,
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await areaService.listAreas(params);

  res.status(200).json(ApiResponse.success("Areas retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const area = await areaService.getArea(req.params.id);

  res.status(200).json(ApiResponse.success("Area retrieved successfully", area));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AreaWriteData;

  const area = await areaService.createArea(values);

  res.status(201).json(ApiResponse.success("Area created successfully", area));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AreaWriteData;

  const area = await areaService.updateArea(req.params.id, values);

  res.status(200).json(ApiResponse.success("Area updated successfully", area));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const area = await areaService.setAreaStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Area status updated successfully", area));
});

export const setPhlebotomyCharge = asyncHandler(async (req: Request, res: Response) => {
  const { phlebotomyCharge } = req.body as { phlebotomyCharge: number | null };

  const area = await areaService.setAreaPhlebotomyCharge(req.params.id, phlebotomyCharge ?? null);

  res.status(200).json(ApiResponse.success("Area phlebotomy charge updated successfully", area));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await areaService.deleteArea(req.params.id);

  res.status(200).json(ApiResponse.success("Area deleted successfully"));
});
