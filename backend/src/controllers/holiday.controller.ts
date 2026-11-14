import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as holidayService from "../services/holiday.service";
import type { HolidayWriteData, ListHolidaysParams } from "../types/holiday.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { cityId, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

  const params: ListHolidaysParams = { cityId, dateFrom, dateTo };

  const rows = await holidayService.listHolidays(params);

  res.status(200).json(ApiResponse.success("Holidays retrieved successfully", rows));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as HolidayWriteData;

  const holiday = await holidayService.createHoliday(values);

  res.status(201).json(ApiResponse.success("Holiday declared successfully", holiday));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await holidayService.deleteHoliday(req.params.id);

  res.status(200).json(ApiResponse.success("Holiday removed successfully"));
});
