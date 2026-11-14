import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as homeFaqService from "../services/homeFaq.service";
import type { HomeFaqWriteData, ListHomeFaqsParams } from "../types/homeFaq.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { isActive, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListHomeFaqsParams = {
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await homeFaqService.listHomeFaqs(params);

  res.status(200).json(ApiResponse.success("FAQs retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const faq = await homeFaqService.getHomeFaq(req.params.id);

  res.status(200).json(ApiResponse.success("FAQ retrieved successfully", faq));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as HomeFaqWriteData;

  const faq = await homeFaqService.createHomeFaq(values);

  res.status(201).json(ApiResponse.success("FAQ created successfully", faq));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as HomeFaqWriteData;

  const faq = await homeFaqService.updateHomeFaq(req.params.id, values);

  res.status(200).json(ApiResponse.success("FAQ updated successfully", faq));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const faq = await homeFaqService.setHomeFaqStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("FAQ status updated successfully", faq));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await homeFaqService.deleteHomeFaq(req.params.id);

  res.status(200).json(ApiResponse.success("FAQ deleted successfully"));
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  await homeFaqService.reorderHomeFaqs(ids);

  res.status(200).json(ApiResponse.success("FAQ order updated successfully"));
});
