import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as cityService from "../services/city.service";
import type { CityWriteData } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, sortBy, sortDir, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const result = await cityService.listCities({
    search,
    active,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.status(200).json(ApiResponse.success("Cities retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const city = await cityService.getCity(req.params.id);

  res.status(200).json(ApiResponse.success("City retrieved successfully", city));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CityWriteData;

  const city = await cityService.createCity(values);

  res.status(201).json(ApiResponse.success("City created successfully", city));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CityWriteData;

  const city = await cityService.updateCity(req.params.id, values);

  res.status(200).json(ApiResponse.success("City updated successfully", city));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const city = await cityService.setCityStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("City status updated successfully", city));
});
