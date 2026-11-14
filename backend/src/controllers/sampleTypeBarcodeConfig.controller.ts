import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as sampleTypeBarcodeConfigService from "../services/sampleTypeBarcodeConfig.service";
import type { ListMasterParams, SampleTypeBarcodeConfigWriteData } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListMasterParams = {
    search,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await sampleTypeBarcodeConfigService.listSampleTypeBarcodeConfigs(params);

  res.status(200).json(ApiResponse.success("Barcode settings retrieved successfully", result));
});

export const getBySampleTypeId = asyncHandler(async (req: Request, res: Response) => {
  const config = await sampleTypeBarcodeConfigService.getSampleTypeBarcodeConfig(
    req.params.sampleTypeId,
  );

  res.status(200).json(ApiResponse.success("Barcode settings retrieved successfully", config));
});

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SampleTypeBarcodeConfigWriteData;

  const config = await sampleTypeBarcodeConfigService.upsertSampleTypeBarcodeConfig(
    req.params.sampleTypeId,
    values,
  );

  res.status(200).json(ApiResponse.success("Barcode settings saved successfully", config));
});
