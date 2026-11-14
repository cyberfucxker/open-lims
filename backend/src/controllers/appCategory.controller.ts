import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadedFileUrl } from "../middleware/appUpload.middleware";
import * as appCategoryService from "../services/appCategory.service";
import type { AppCategoryWriteData, ListAppCategoriesParams } from "../types/appCategory.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, isActive, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListAppCategoriesParams = {
    search,
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await appCategoryService.listAppCategories(params);

  res.status(200).json(ApiResponse.success("Categories retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await appCategoryService.getAppCategory(req.params.id);

  res.status(200).json(ApiResponse.success("Category retrieved successfully", category));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AppCategoryWriteData;

  const category = await appCategoryService.createAppCategory(values);

  res.status(201).json(ApiResponse.success("Category created successfully", category));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AppCategoryWriteData;

  const category = await appCategoryService.updateAppCategory(req.params.id, values);

  res.status(200).json(ApiResponse.success("Category updated successfully", category));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const category = await appCategoryService.setAppCategoryStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Category status updated successfully", category));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await appCategoryService.deleteAppCategory(req.params.id);

  res.status(200).json(ApiResponse.success("Category deleted successfully"));
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  await appCategoryService.reorderAppCategories(ids);

  res.status(200).json(ApiResponse.success("Category order updated successfully"));
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file was uploaded");
  }

  res
    .status(200)
    .json(
      ApiResponse.success("File uploaded successfully", {
        url: uploadedFileUrl(req.file.filename),
      }),
    );
});
