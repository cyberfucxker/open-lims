import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as containerService from "../services/container.service";
import type { ContainerWriteData, ListMasterParams } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, includeDeleted, sortBy, sortDir, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListMasterParams = {
    search,
    active,
    includeDeleted,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await containerService.listContainers(params);

  res.status(200).json(ApiResponse.success("Containers retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const container = await containerService.getContainer(req.params.id);

  res.status(200).json(ApiResponse.success("Container retrieved successfully", container));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ContainerWriteData;

  const container = await containerService.createContainer(values);

  res.status(201).json(ApiResponse.success("Container created successfully", container));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ContainerWriteData;

  const container = await containerService.updateContainer(req.params.id, values);

  res.status(200).json(ApiResponse.success("Container updated successfully", container));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await containerService.deleteContainer(req.params.id);

  res.status(200).json(ApiResponse.success("Container deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const container = await containerService.restoreContainer(req.params.id);

  res.status(200).json(ApiResponse.success("Container restored successfully", container));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const container = await containerService.setContainerStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Container status updated successfully", container));
});
