import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { franchiseScope } from "../middleware/franchise.middleware";
import * as franchiseService from "../services/franchise.service";
import * as franchiseDashboardService from "../services/franchiseDashboard.service";
import * as appOrderService from "../services/appOrder.service";
import * as areaApprovalRequestService from "../services/areaApprovalRequest.service";
import * as organizationNotificationService from "../services/organizationNotification.service";
import * as phlebotomistService from "../services/phlebotomist.service";
import * as reportService from "../services/report.service";
import { FRANCHISE_PERIODS, type FranchisePeriod } from "../types/franchise.types";
import type {
  AddHomeVisitItemsInput,
  AssignPhleboInput,
  CreateAppOrderInput,
  ListAppOrdersParams,
  UpdateAppOrderStatusInput,
} from "../types/appOrder.types";
import type { ListReportsParams } from "../types/report.types";

/**
 * Every handler here derives its scope from `franchiseScope(req)`, which reads
 * the middleware-resolved session. No handler accepts an organization id from
 * the request — that is deliberate and load-bearing, not incidental.
 */

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const profile = await franchiseService.getProfile(organizationId);

  res.status(200).json(ApiResponse.success("Profile retrieved successfully", profile));
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const profile = await franchiseService.updateProfile(organizationId, req.body);

  res.status(200).json(ApiResponse.success("Profile updated successfully", profile));
});

export const uploadLabLogo = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  if (!req.file) {
    throw ApiError.badRequest("Select a logo image to upload");
  }

  const profile = await franchiseService.saveLabLogo(
    organizationId,
    `/uploads/${req.file.filename}`,
  );

  res.status(200).json(ApiResponse.success("Lab logo updated successfully", profile));
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const requested = String(req.query.period ?? "month");
  const period = (
    FRANCHISE_PERIODS.includes(requested as FranchisePeriod) ? requested : "month"
  ) as FranchisePeriod;

  const dashboard = await franchiseDashboardService.getFranchiseDashboard(organizationId, period);

  res.status(200).json(ApiResponse.success("Dashboard retrieved successfully", dashboard));
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { search, status, paymentStatus, dateFrom, dateTo, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const result = await appOrderService.listAppOrders({
    search,
    status: status as ListAppOrdersParams["status"],
    paymentStatus: paymentStatus as ListAppOrdersParams["paymentStatus"],
    dateFrom,
    dateTo,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
    // Applied last so a crafted `organizationId` in the query string cannot
    // override it — the spread above never reads one.
    organizationId,
  });

  res.status(200).json(ApiResponse.success("Orders retrieved successfully", result));
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const order = await appOrderService.getAppOrderDetail(req.params.id, organizationId);

  res.status(200).json(ApiResponse.success("Order retrieved successfully", order));
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const values = req.body as CreateAppOrderInput;

  const order = await appOrderService.createManualOrder({ ...values, organizationId });

  res.status(201).json(ApiResponse.success("Order created successfully", order));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { status } = req.body as UpdateAppOrderStatusInput;

  const order = await appOrderService.updateAppOrderStatus(req.params.id, status, organizationId);

  res.status(200).json(ApiResponse.success("Order status updated successfully", order));
});

export const assignOrderPhlebo = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { phleboId } = req.body as AssignPhleboInput;

  const order = await appOrderService.assignPhlebo(req.params.id, phleboId, organizationId);

  res.status(200).json(ApiResponse.success("Phlebotomist assignment updated successfully", order));
});

export const addOrderHomeVisitItems = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { testIds, packageIds } = req.body as AddHomeVisitItemsInput;

  const order = await appOrderService.addHomeVisitItems(
    req.params.id,
    { testIds, packageIds },
    undefined,
    organizationId,
  );

  res.status(200).json(ApiResponse.success("Tests added to booking", order));
});

export const removeOrderHomeVisitItem = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);

  const order = await appOrderService.removeHomeVisitItem(
    req.params.id,
    req.params.itemId,
    undefined,
    organizationId,
  );

  res.status(200).json(ApiResponse.success("Test removed from booking", order));
});

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { search, view, dateFrom, dateTo, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const result = await reportService.listReports({
    search,
    view: view as ListReportsParams["view"],
    dateFrom,
    dateTo,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
    organizationId,
  });

  res.status(200).json(ApiResponse.success("Reports retrieved successfully", result));
});

// ---------------------------------------------------------------------------
// Price list
// ---------------------------------------------------------------------------

export const getPriceList = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const priceList = await franchiseService.getOwnPriceList(organizationId);

  res.status(200).json(ApiResponse.success("Price list retrieved successfully", priceList));
});

export const setPriceListItems = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { items } = req.body as {
    items: Array<
      Omit<Parameters<typeof franchiseService.setOwnPriceListItems>[1][number], "isOffered"> & {
        isOffered?: boolean;
      }
    >;
  };

  // Old clients that don't yet send `isOffered` mean "offered" — same default
  // as an absent row (see `PriceListItem.isOffered`'s doc-comment).
  const priceList = await franchiseService.setOwnPriceListItems(
    organizationId,
    items.map((item) => ({ ...item, isOffered: item.isOffered ?? true })),
  );

  res.status(200).json(ApiResponse.success("Prices updated successfully", priceList));
});

// ---------------------------------------------------------------------------
// Service areas — read-only here; assignment is an admin action
// (`PUT /organizations/:id/service-areas`).
// ---------------------------------------------------------------------------

export const getServiceAreas = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const areas = await franchiseService.getServiceAreas(organizationId);

  res.status(200).json(ApiResponse.success("Service areas retrieved successfully", areas));
});

// ---------------------------------------------------------------------------
// Phlebotomists — a franchise's own only. See
// `phlebotomist.service.ts#createOwnPhlebotomist`'s doc-comment for the
// area-scoping rule.
// ---------------------------------------------------------------------------

export const listPhlebotomists = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const phlebotomists = await phlebotomistService.listOwnPhlebotomists(organizationId);

  res.status(200).json(ApiResponse.success("Phlebotomists retrieved successfully", phlebotomists));
});

export const createPhlebotomist = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const phlebotomist = await phlebotomistService.createOwnPhlebotomist(organizationId, req.body);

  res.status(201).json(ApiResponse.success("Phlebotomist created successfully", phlebotomist));
});

export const setPhlebotomistStatus = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { isActive } = req.body as { isActive: boolean };

  const phlebotomist = await phlebotomistService.setOwnPhlebotomistStatus(
    organizationId,
    req.params.id,
    isActive,
  );

  res
    .status(200)
    .json(ApiResponse.success("Phlebotomist status updated successfully", phlebotomist));
});

// ---------------------------------------------------------------------------
// Area requests — propose new coverage in this franchise's own city,
// pending Superadmin's "Area Approval" review.
// ---------------------------------------------------------------------------

export const createAreaRequest = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { name, pincodes } = req.body as { name: string; pincodes?: string[] };

  const request = await areaApprovalRequestService.createAreaApprovalRequest(organizationId, {
    name,
    pincodes,
  });

  res.status(201).json(ApiResponse.success("Area request submitted for approval", request));
});

export const listAreaRequests = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const requests = await areaApprovalRequestService.listOwnAreaApprovalRequests(organizationId);

  res.status(200).json(ApiResponse.success("Area requests retrieved successfully", requests));
});

// ---------------------------------------------------------------------------
// Notifications — this franchise's own in-app feed (e.g. "New booking").
// ---------------------------------------------------------------------------

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const { page, pageSize } = req.query as Record<string, string | undefined>;

  const result = await organizationNotificationService.listOwnNotifications(organizationId, {
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.status(200).json(ApiResponse.success("Notifications retrieved successfully", result));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  await organizationNotificationService.markOwnNotificationRead(organizationId, req.params.id);

  res.status(200).json(ApiResponse.success("Notification marked as read"));
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = franchiseScope(req);
  const result = await organizationNotificationService.markAllOwnNotificationsRead(organizationId);

  res.status(200).json(ApiResponse.success("Notifications marked as read", result));
});
