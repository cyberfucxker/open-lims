import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as slotService from "../../services/app/slot.service";

export const getSlotAvailability = asyncHandler(async (req: Request, res: Response) => {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  const {
    date,
    address_id: addressId,
    order_id: orderId,
  } = req.query as { date: string; address_id?: string; order_id?: string };

  const result = await slotService.getSlotAvailability(req.appUser.id, date, {
    addressId,
    orderId,
  });

  res.status(200).json(AppApiResponse.success("Slot availability fetched successfully", result));
});
