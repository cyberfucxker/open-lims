import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as webBannerService from "../services/webBanner.service";
import type { ListWebBannersParams, WebBannerWriteData } from "../types/webBanner.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { placement, isActive, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListWebBannersParams = {
    placement: placement as ListWebBannersParams["placement"],
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await webBannerService.listWebBanners(params);

  res.status(200).json(ApiResponse.success("Web banners retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const banner = await webBannerService.getWebBanner(req.params.id);

  res.status(200).json(ApiResponse.success("Web banner retrieved successfully", banner));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as WebBannerWriteData;

  const banner = await webBannerService.createWebBanner(values);

  res.status(201).json(ApiResponse.success("Web banner created successfully", banner));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as WebBannerWriteData;

  const banner = await webBannerService.updateWebBanner(req.params.id, values);

  res.status(200).json(ApiResponse.success("Web banner updated successfully", banner));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const banner = await webBannerService.setWebBannerStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Web banner status updated successfully", banner));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await webBannerService.deleteWebBanner(req.params.id);

  res.status(200).json(ApiResponse.success("Web banner deleted successfully"));
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  await webBannerService.reorderWebBanners(ids);

  res.status(200).json(ApiResponse.success("Web banners reordered successfully"));
});
