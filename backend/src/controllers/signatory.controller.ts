import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as signatoryService from "../services/signatory.service";
import type { ListSignatoriesParams, SignatoryWriteData } from "../types/signatory.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, page, pageSize } = req.query as Record<string, string | undefined>;
  const params: ListSignatoriesParams = {
    search,
    active,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
  const result = await signatoryService.listSignatories(params);
  res.status(200).json(ApiResponse.success("Signatories retrieved successfully", result));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SignatoryWriteData;
  const signatory = await signatoryService.createSignatory(values);
  res.status(201).json(ApiResponse.success("Signatory added successfully", signatory));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SignatoryWriteData;
  const signatory = await signatoryService.updateSignatory(req.params.id, values);
  res.status(200).json(ApiResponse.success("Signatory updated successfully", signatory));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await signatoryService.removeSignatory(req.params.id);
  res.status(200).json(ApiResponse.success("Signatory deleted successfully", null));
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file was uploaded");
  }
  const signatory = await signatoryService.updateSignatoryImage(
    req.params.id,
    `/uploads/${req.file.filename}`,
  );
  res.status(200).json(ApiResponse.success("Signature image uploaded successfully", signatory));
});
