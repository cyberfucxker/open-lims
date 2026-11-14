import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as citySlotConfigService from "../services/citySlotConfig.service";
import type { AssignCitySlotTemplatesData } from "../types/citySlotConfig.types";

export const getConfig = asyncHandler(async (req: Request, res: Response) => {
  const { cityId } = req.query as Record<string, string | undefined>;
  if (!cityId) {
    throw ApiError.badRequest("cityId is required");
  }

  const config = await citySlotConfigService.getCitySlotConfig(cityId);

  res
    .status(200)
    .json(ApiResponse.success("City slot configuration retrieved successfully", config));
});

export const listCities = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await citySlotConfigService.listCitiesWithCutoverStatus();

  res.status(200).json(ApiResponse.success("Cities retrieved successfully", rows));
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AssignCitySlotTemplatesData;

  const config = await citySlotConfigService.assignCitySlotTemplates(values);

  res.status(200).json(ApiResponse.success("City slot templates assigned successfully", config));
});

export const setCutover = asyncHandler(async (req: Request, res: Response) => {
  const { useNewSlotSystem } = req.body as { useNewSlotSystem: boolean };

  const config = await citySlotConfigService.setCityCutover(req.params.cityId, useNewSlotSystem);

  res
    .status(200)
    .json(ApiResponse.success("City slot system cutover updated successfully", config));
});

export const setPhlebotomyCharge = asyncHandler(async (req: Request, res: Response) => {
  const { phlebotomyCharge } = req.body as { phlebotomyCharge: number };

  const rows = await citySlotConfigService.setCityPhlebotomyCharge(
    req.params.cityId,
    phlebotomyCharge,
  );

  res.status(200).json(ApiResponse.success("City phlebotomy charge updated successfully", rows));
});

export const setParentOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.body as { organizationId: string | null };

  const rows = await citySlotConfigService.setCityParentOrganization(
    req.params.cityId,
    organizationId ?? null,
  );

  res.status(200).json(ApiResponse.success("City parent franchise updated successfully", rows));
});
