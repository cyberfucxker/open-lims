import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as areaApprovalRequestService from "../services/areaApprovalRequest.service";
import type { ListAreaApprovalRequestsParams } from "../types/areaApproval.types";

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.user;
}

/** Superadmin's "Area Approval" tab (Cities & Areas) — review and decide
 *  every franchise's self-service new-area requests. See
 *  `areaApprovalRequest.service.ts` for what approve/reject actually do. */

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListAreaApprovalRequestsParams = {
    status: status as ListAreaApprovalRequestsParams["status"],
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await areaApprovalRequestService.listAreaApprovalRequests(params);

  res.status(200).json(ApiResponse.success("Area requests retrieved successfully", result));
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const request = await areaApprovalRequestService.approveAreaApprovalRequest(
    req.params.id,
    user.id,
  );

  res.status(200).json(ApiResponse.success("Area request approved", request));
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { reason } = req.body as { reason?: string };

  const request = await areaApprovalRequestService.rejectAreaApprovalRequest(
    req.params.id,
    user.id,
    reason,
  );

  res.status(200).json(ApiResponse.success("Area request rejected", request));
});
