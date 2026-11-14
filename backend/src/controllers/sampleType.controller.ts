import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as sampleTypeService from "../services/sampleType.service";
import type { ListMasterParams, SampleTypeWriteData } from "../types/master.types";

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

  const result = await sampleTypeService.listSampleTypes(params);

  res.status(200).json(ApiResponse.success("Sample types retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const sampleType = await sampleTypeService.getSampleType(req.params.id);

  res.status(200).json(ApiResponse.success("Sample type retrieved successfully", sampleType));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SampleTypeWriteData;

  const sampleType = await sampleTypeService.createSampleType(values);

  res.status(201).json(ApiResponse.success("Sample type created successfully", sampleType));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SampleTypeWriteData;

  const sampleType = await sampleTypeService.updateSampleType(req.params.id, values);

  res.status(200).json(ApiResponse.success("Sample type updated successfully", sampleType));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await sampleTypeService.deleteSampleType(req.params.id);

  res.status(200).json(ApiResponse.success("Sample type deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const sampleType = await sampleTypeService.restoreSampleType(req.params.id);

  res.status(200).json(ApiResponse.success("Sample type restored successfully", sampleType));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const sampleType = await sampleTypeService.setSampleTypeStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Sample type status updated successfully", sampleType));
});
