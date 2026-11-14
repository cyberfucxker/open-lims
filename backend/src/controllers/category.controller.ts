import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as categoryService from "../services/category.service";
import type { CategoryWriteData, ListCategoriesParams } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, includeDeleted, departmentId, sortBy, sortDir, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListCategoriesParams = {
    search,
    active,
    includeDeleted,
    departmentId,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await categoryService.listCategories(params);

  res.status(200).json(ApiResponse.success("Categories retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategory(req.params.id);

  res.status(200).json(ApiResponse.success("Category retrieved successfully", category));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CategoryWriteData;

  const category = await categoryService.createCategory(values);

  res.status(201).json(ApiResponse.success("Category created successfully", category));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CategoryWriteData;

  const category = await categoryService.updateCategory(req.params.id, values);

  res.status(200).json(ApiResponse.success("Category updated successfully", category));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);

  res.status(200).json(ApiResponse.success("Category deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.restoreCategory(req.params.id);

  res.status(200).json(ApiResponse.success("Category restored successfully", category));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const category = await categoryService.setCategoryStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Category status updated successfully", category));
});
