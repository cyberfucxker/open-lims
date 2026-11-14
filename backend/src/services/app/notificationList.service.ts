import type { AppNotificationType } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import * as notificationRepository from "../../repositories/notification.repository";

/** DB enum is UPPER_SNAKE (`ORDER_UPDATE`); the Flutter client's
 *  PUSH_NOTIFICATION_API_SPEC.md contract is lower_snake (`order_update`) —
 *  this is the one place that boundary gets crossed, in both directions. */
const TYPE_TO_API: Record<AppNotificationType, string> = {
  ORDER_UPDATE: "order_update",
  REPORT_READY: "report_ready",
  PROMO: "promo",
  PRESCRIPTION_STATUS: "prescription_status",
  APPOINTMENT_REMINDER: "appointment_reminder",
  BOOKING_CANCELLED: "booking_cancelled",
};

const API_TO_TYPE: Record<string, AppNotificationType> = Object.fromEntries(
  Object.entries(TYPE_TO_API).map(([dbValue, apiValue]) => [
    apiValue,
    dbValue as AppNotificationType,
  ]),
);

export interface NotificationListItemDto {
  id: string;
  type: string;
  title: string;
  message: string;
  image_url: string | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResult {
  notifications: NotificationListItemDto[];
  unread_count: number;
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

export interface ListNotificationsParams {
  page?: number;
  perPage?: number;
  isRead?: boolean;
  type?: string;
}

export async function listNotifications(
  appUserId: string,
  params: ListNotificationsParams,
): Promise<NotificationListResult> {
  if (params.type && !(params.type in API_TO_TYPE)) {
    throw ApiError.badRequest(`type must be one of: ${Object.keys(API_TO_TYPE).join(", ")}`);
  }

  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const perPage = params.perPage && params.perPage > 0 ? params.perPage : DEFAULT_PER_PAGE;

  const { rows, total, unreadCount } = await notificationRepository.listNotifications({
    appUserId,
    isRead: params.isRead,
    type: params.type ? API_TO_TYPE[params.type] : undefined,
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return {
    notifications: rows.map((row) => ({
      id: row.id,
      type: TYPE_TO_API[row.type],
      title: row.title,
      message: row.message,
      image_url: row.imageUrl,
      target_id: row.targetId,
      is_read: row.isRead,
      created_at: row.createdAt.toISOString(),
    })),
    unread_count: unreadCount,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_items: total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}

export interface MarkNotificationsReadInput {
  notification_ids?: string[];
  mark_all_read?: boolean;
}

/**
 * `mark_all_read: true` wins outright (per spec, `notification_ids` is
 * ignored when present). Otherwise, ids that don't belong to this user (or
 * don't exist) are silently dropped rather than 403ing — the spec's "no
 * ownership leak" rule — UNLESS *none* of the ids matched at all, in which
 * case this is indistinguishable from a bogus/foreign request and 404s.
 * Re-marking an already-read id is a normal idempotent success, not a 404.
 */
export async function markNotificationsRead(
  appUserId: string,
  input: MarkNotificationsReadInput,
): Promise<void> {
  if (input.mark_all_read) {
    await notificationRepository.markAllNotificationsRead(appUserId);
    return;
  }

  if (!input.notification_ids || input.notification_ids.length === 0) {
    throw ApiError.badRequest("Provide notification_ids or mark_all_read: true");
  }

  const result = await notificationRepository.markNotificationsRead(
    appUserId,
    input.notification_ids,
  );
  if (result.count === 0) {
    const owned = await notificationRepository.countOwnedNotifications(
      appUserId,
      input.notification_ids,
    );
    if (owned === 0) {
      throw ApiError.notFound("Notification not found");
    }
    // else: every matching id was already read — idempotent success.
  }
}

export async function getNotificationSettings(
  appUserId: string,
): Promise<{ push_enabled: boolean }> {
  const appUser = await notificationRepository.getNotificationPreference(appUserId);
  // Row always exists once an AppUser does (plain column, not a lazily-
  // created side table) — the `?? true` is just belt-and-braces.
  return { push_enabled: appUser?.pushEnabled ?? true };
}

export async function updateNotificationSettings(
  appUserId: string,
  pushEnabled: boolean,
): Promise<{ push_enabled: boolean }> {
  const appUser = await notificationRepository.setNotificationPreference(appUserId, pushEnabled);
  return { push_enabled: appUser.pushEnabled };
}
