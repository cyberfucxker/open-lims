import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as notificationListService from "../../services/app/notificationList.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { page, per_page, is_read, type } = req.query as Record<string, string | undefined>;

  const result = await notificationListService.listNotifications(appUser.id, {
    page: page ? Number(page) : undefined,
    perPage: per_page ? Number(per_page) : undefined,
    isRead: is_read === undefined ? undefined : is_read === "true",
    type,
  });

  res.status(200).json(AppApiResponse.success("Notifications fetched successfully", result));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { notification_ids, mark_all_read } = req.body as {
    notification_ids?: string[];
    mark_all_read?: boolean;
  };

  await notificationListService.markNotificationsRead(appUser.id, {
    notification_ids,
    mark_all_read,
  });

  res.status(200).json(AppApiResponse.success("Notifications marked as read"));
});

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const settings = await notificationListService.getNotificationSettings(appUser.id);
  res
    .status(200)
    .json(AppApiResponse.success("Notification settings fetched successfully", settings));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { push_enabled } = req.body as { push_enabled: boolean };
  const settings = await notificationListService.updateNotificationSettings(
    appUser.id,
    push_enabled,
  );
  res.status(200).json(AppApiResponse.success("Notification preference updated", settings));
});
