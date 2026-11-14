import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as orderService from "../../services/app/order.service";
import * as homeVisitService from "../../services/app/homeVisit.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const reviewCart = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as { address_id: string; slot_id: string; date: string };

  const result = await orderService.reviewCart(appUser.id, input, appUser.platform);

  res.status(200).json(AppApiResponse.success("Cart reviewed successfully", result));
});

export const confirmOrder = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as { order_id: string; payment_type: "cash" | "online" };

  const result = await orderService.confirmOrder(appUser.id, input, appUser.platform);

  res.status(200).json(AppApiResponse.success("Order confirmed successfully", result));
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { status } = req.query as { status?: "all" | "upcoming" | "past" };

  const orders = await orderService.listOrders(appUser.id, status ?? "all");

  res.status(200).json(AppApiResponse.success("Orders fetched successfully", orders));
});

export const getOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);

  const order = await orderService.getOrderDetail(appUser.id, req.params.id);

  res.status(200).json(AppApiResponse.success("Order details fetched successfully", order));
});

export const rescheduleOrder = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { date, slot_id } = req.body as orderService.RescheduleOrderInput;

  const result = await orderService.rescheduleOrder(appUser.id, req.params.orderId, {
    date,
    slot_id,
  });

  res.status(200).json(AppApiResponse.success("Order rescheduled successfully", result));
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { reason } = req.body as { reason: string };

  await orderService.cancelOrder(appUser.id, req.params.orderId, reason);

  res.status(200).json(AppApiResponse.success("Order cancelled successfully"));
});

export const createHomeVisit = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as homeVisitService.CreateHomeVisitBookingInput;

  const result = await homeVisitService.createHomeVisitBooking(appUser.id, input, appUser.platform);

  res.status(200).json(AppApiResponse.success("Home visit booked successfully", result));
});
