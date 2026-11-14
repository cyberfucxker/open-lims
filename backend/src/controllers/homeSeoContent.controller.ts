import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as homeSeoContentService from "../services/homeSeoContent.service";
import type { HomeSeoContentWriteData } from "../types/homeSeoContent.types";

export const get = asyncHandler(async (_req: Request, res: Response) => {
  const content = await homeSeoContentService.getHomeSeoContent();

  res.status(200).json(ApiResponse.success("Home SEO content retrieved successfully", content));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as HomeSeoContentWriteData;

  const content = await homeSeoContentService.updateHomeSeoContent(values);

  res.status(200).json(ApiResponse.success("Home SEO content updated successfully", content));
});
