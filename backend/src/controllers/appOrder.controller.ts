import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as appOrderService from "../services/appOrder.service";
import type {
  AddHomeVisitItemsInput,
  AssignPhleboInput,
  CreateAppOrderInput,
  ListAppOrdersParams,
  UpdateAppOrderStatusInput,
} from "../types/appOrder.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, phleboId, paymentMode, paymentStatus, dateFrom, dateTo, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListAppOrdersParams = {
    search,
    status: status as ListAppOrdersParams["status"],
    phleboId,
    paymentMode: paymentMode as ListAppOrdersParams["paymentMode"],
    paymentStatus: paymentStatus as ListAppOrdersParams["paymentStatus"],
    dateFrom,
    dateTo,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await appOrderService.listAppOrders(params);

  res.status(200).json(ApiResponse.success("Orders retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await appOrderService.getAppOrderDetail(req.params.id);

  res.status(200).json(ApiResponse.success("Order retrieved successfully", order));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as UpdateAppOrderStatusInput;

  const order = await appOrderService.updateAppOrderStatus(req.params.id, status);

  res.status(200).json(ApiResponse.success("Order status updated successfully", order));
});

export const assignPhlebo = asyncHandler(async (req: Request, res: Response) => {
  const { phleboId } = req.body as AssignPhleboInput;

  const order = await appOrderService.assignPhlebo(req.params.id, phleboId);

  res.status(200).json(ApiResponse.success("Phlebotomist assignment updated successfully", order));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CreateAppOrderInput;

  const order = await appOrderService.createManualOrder(values);

  res.status(201).json(ApiResponse.success("Order created successfully", order));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await appOrderService.deleteAppOrder(req.params.id);

  res.status(200).json(ApiResponse.success("Order deleted successfully"));
});

// Local fallback for the Phlebo App's own "add tests" screen, which doesn't
// exist yet — lets an admin pick the tests on a home-visit booking's behalf
// from Order Management so the flow is testable end to end before that
// Flutter screen ships. Same underlying action either way (see
// `appOrder.service.ts#addHomeVisitItems`'s doc-comment).
export const addHomeVisitItems = asyncHandler(async (req: Request, res: Response) => {
  const { testIds, packageIds } = req.body as AddHomeVisitItemsInput;

  const order = await appOrderService.addHomeVisitItems(req.params.id, { testIds, packageIds });

  res.status(200).json(ApiResponse.success("Tests added to booking", order));
});

// Mirror of the above — drops one test/package line an admin (or the phlebo,
// via the equivalent phlebo-app route) had added, re-billing the booking from
// whatever's left (see `appOrder.service.ts#removeHomeVisitItem`).
export const removeHomeVisitItem = asyncHandler(async (req: Request, res: Response) => {
  const order = await appOrderService.removeHomeVisitItem(req.params.id, req.params.itemId);

  res.status(200).json(ApiResponse.success("Test removed from booking", order));
});
