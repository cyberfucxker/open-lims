import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadedFileUrl } from "../middleware/appUpload.middleware";
import * as cmsPageService from "../services/cmsPage.service";
import type { CmsPageStatus, CmsPageWriteData, ListCmsPagesParams } from "../types/cmsPage.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { appType, status, search, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListCmsPagesParams = {
    appType: appType as ListCmsPagesParams["appType"],
    status: status as ListCmsPagesParams["status"],
    search,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await cmsPageService.listCmsPages(params);

  res.status(200).json(ApiResponse.success("Pages retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const page = await cmsPageService.getCmsPage(req.params.id);

  res.status(200).json(ApiResponse.success("Page retrieved successfully", page));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CmsPageWriteData;

  const page = await cmsPageService.createCmsPage(values, req.user?.id ?? null);

  res.status(201).json(ApiResponse.success("Page created successfully", page));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CmsPageWriteData;

  const page = await cmsPageService.updateCmsPage(req.params.id, values, req.user?.id ?? null);

  res.status(200).json(ApiResponse.success("Page updated successfully", page));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: CmsPageStatus };

  const page = await cmsPageService.setCmsPageStatus(req.params.id, status, req.user?.id ?? null);

  const message =
    status === "PUBLISHED" ? "Page published successfully" : "Page unpublished successfully";
  res.status(200).json(ApiResponse.success(message, page));
});

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const page = await cmsPageService.duplicateCmsPage(req.params.id, req.user?.id ?? null);

  res.status(201).json(ApiResponse.success("Page duplicated successfully", page));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await cmsPageService.deleteCmsPage(req.params.id);

  res.status(200).json(ApiResponse.success("Page deleted successfully"));
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file was uploaded");
  }

  res.status(200).json(
    ApiResponse.success("File uploaded successfully", {
      url: uploadedFileUrl(req.file.filename),
    }),
  );
});
