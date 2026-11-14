import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as notificationService from "../../services/phlebo/notification.service";

function requirePhlebo(req: Request) {
  if (!req.phlebo) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.phlebo;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { page, per_page, is_read, type } = req.query as Record<string, string | undefined>;

  const result = await notificationService.listNotifications(phlebo.id, {
    page: page ? Number(page) : undefined,
    perPage: per_page ? Number(per_page) : undefined,
    isRead: is_read === undefined ? undefined : is_read === "true",
    type,
  });

  res.status(200).json(AppApiResponse.success("Notifications fetched successfully", result));
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const result = await notificationService.getUnreadCount(phlebo.id);

  res.status(200).json(AppApiResponse.success("Unread count fetched successfully", result));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  await notificationService.markNotificationRead(phlebo.id, req.params.id);

  res.status(200).json(AppApiResponse.success("Notification marked as read"));
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const result = await notificationService.markAllNotificationsRead(phlebo.id);

  res.status(200).json(AppApiResponse.success("All notifications marked as read", result));
});
