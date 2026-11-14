import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadedFileUrl } from "../middleware/appUpload.middleware";
import * as bannerService from "../services/banner.service";
import type { BannerWriteData, ListBannersParams } from "../types/banner.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { isActive, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListBannersParams = {
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await bannerService.listBanners(params);

  res.status(200).json(ApiResponse.success("Banners retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const banner = await bannerService.getBanner(req.params.id);

  res.status(200).json(ApiResponse.success("Banner retrieved successfully", banner));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as BannerWriteData;

  const banner = await bannerService.createBanner(values);

  res.status(201).json(ApiResponse.success("Banner created successfully", banner));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as BannerWriteData;

  const banner = await bannerService.updateBanner(req.params.id, values);

  res.status(200).json(ApiResponse.success("Banner updated successfully", banner));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const banner = await bannerService.setBannerStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Banner status updated successfully", banner));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await bannerService.deleteBanner(req.params.id);

  res.status(200).json(ApiResponse.success("Banner deleted successfully"));
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  await bannerService.reorderBanners(ids);

  res.status(200).json(ApiResponse.success("Banner order updated successfully"));
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
