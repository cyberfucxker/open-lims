import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as slotTemplateService from "../services/slotTemplate.service";
import type { ListSlotTemplatesParams, SlotTemplateWriteData } from "../types/slotTemplate.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListSlotTemplatesParams = {
    search,
    active,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await slotTemplateService.listSlotTemplates(params);

  res.status(200).json(ApiResponse.success("Slot templates retrieved successfully", result));
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await slotTemplateService.listActiveSlotTemplates();

  res.status(200).json(ApiResponse.success("Active slot templates retrieved successfully", rows));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const template = await slotTemplateService.getSlotTemplate(req.params.id);

  res.status(200).json(ApiResponse.success("Slot template retrieved successfully", template));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SlotTemplateWriteData;

  const template = await slotTemplateService.createSlotTemplate(values);

  res.status(201).json(ApiResponse.success("Slot template created successfully", template));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SlotTemplateWriteData;

  const template = await slotTemplateService.updateSlotTemplate(req.params.id, values);

  res.status(200).json(ApiResponse.success("Slot template updated successfully", template));
});

export const setActive = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const template = await slotTemplateService.setSlotTemplateActive(req.params.id, active);

  res.status(200).json(ApiResponse.success("Slot template status updated successfully", template));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await slotTemplateService.deleteSlotTemplate(req.params.id);

  res.status(200).json(ApiResponse.success("Slot template deleted successfully"));
});
