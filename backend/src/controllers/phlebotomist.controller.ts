import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as phlebotomistService from "../services/phlebotomist.service";
import type { ListPhlebotomistsParams, PhlebotomistWriteData } from "../types/phlebotomist.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, isActive, cityId, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListPhlebotomistsParams = {
    search,
    isActive,
    cityId,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await phlebotomistService.listPhlebotomists(params);

  res.status(200).json(ApiResponse.success("Phlebotomists retrieved successfully", result));
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await phlebotomistService.listActivePhlebotomists();

  res.status(200).json(ApiResponse.success("Active phlebotomists retrieved successfully", rows));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const phlebotomist = await phlebotomistService.getPhlebotomist(req.params.id);

  res.status(200).json(ApiResponse.success("Phlebotomist retrieved successfully", phlebotomist));
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await phlebotomistService.getPhlebotomistStats(req.params.id);

  res.status(200).json(ApiResponse.success("Phlebotomist stats retrieved successfully", stats));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PhlebotomistWriteData;

  const phlebotomist = await phlebotomistService.createPhlebotomist(values);

  res.status(201).json(ApiResponse.success("Phlebotomist created successfully", phlebotomist));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PhlebotomistWriteData;

  const phlebotomist = await phlebotomistService.updatePhlebotomist(req.params.id, values);

  res.status(200).json(ApiResponse.success("Phlebotomist updated successfully", phlebotomist));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const phlebotomist = await phlebotomistService.setPhlebotomistStatus(req.params.id, isActive);

  res
    .status(200)
    .json(ApiResponse.success("Phlebotomist status updated successfully", phlebotomist));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await phlebotomistService.deletePhlebotomist(req.params.id);

  res.status(200).json(ApiResponse.success("Phlebotomist deleted successfully"));
});
