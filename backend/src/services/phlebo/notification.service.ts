import type { PhleboNotificationType } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import * as phleboNotificationRepository from "../../repositories/phleboNotification.repository";

/** The phlebo app's in-app notification list. Rows are written by
 *  `orderNotification.service.ts` as bookings are assigned, cancelled or
 *  taken away — nothing here creates them, this is the read/mark-read side.
 *
 *  DB enum is UPPER_SNAKE (`NEW_ASSIGNMENT`); this module's API is
 *  lower_snake (`new_assignment`), same boundary the patient app's
 *  `notificationList.service.ts` and this module's own booking-status slugs
 *  cross. */

const TYPE_TO_API: Record<PhleboNotificationType, string> = {
  NEW_ASSIGNMENT: "new_assignment",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_UNASSIGNED: "booking_unassigned",
  BOOKING_RESCHEDULED: "booking_rescheduled",
};

const API_TO_TYPE: Record<string, PhleboNotificationType> = Object.fromEntries(
  Object.entries(TYPE_TO_API).map(([dbValue, apiValue]) => [
    apiValue,
    dbValue as PhleboNotificationType,
  ]),
);

export const NOTIFICATION_TYPE_SLUGS = Object.keys(API_TO_TYPE);

export interface PhleboNotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  /** The `AppOrder.id` to open on tap, or null for a notification that
   *  isn't about one particular booking. */
  target_id: string | null;
  is_read: boolean;
  created_at: string;
}

/** Flat `current_page`/`last_page`/`total`, matching this module's booking
 *  lists rather than the patient app's nested `pagination` object — one
 *  client parses these, and it should only have to learn one shape.
 *  `unread_count` rides along so the bell badge needs no second call. */
export interface PhleboNotificationListResult {
  notifications: PhleboNotificationDto[];
  unread_count: number;
  current_page: number;
  last_page: number;
  total: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

export interface ListPhleboNotificationsParams {
  page?: number;
  perPage?: number;
  isRead?: boolean;
  type?: string;
}

export async function listNotifications(
  phleboId: string,
  params: ListPhleboNotificationsParams,
): Promise<PhleboNotificationListResult> {
  if (params.type && !(params.type in API_TO_TYPE)) {
    throw ApiError.badRequest(`type must be one of: ${NOTIFICATION_TYPE_SLUGS.join(", ")}`);
  }

  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const perPage = params.perPage && params.perPage > 0 ? params.perPage : DEFAULT_PER_PAGE;

  const { rows, total, unreadCount } = await phleboNotificationRepository.listPhleboNotifications({
    phleboId,
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
      target_id: row.targetId,
      is_read: row.isRead,
      created_at: row.createdAt.toISOString(),
    })),
    unread_count: unreadCount,
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    total,
  };
}

/** Marking an already-read notification read again is a success, not an
 *  error — the app fires this on tap and shouldn't have to track which rows
 *  it has already reported. An id that isn't this phlebo's (or doesn't
 *  exist) 404s; the two cases are indistinguishable on purpose, so a
 *  guessed id can't confirm another phlebo's notification exists. */
export async function markNotificationRead(phleboId: string, id: string): Promise<void> {
  const result = await phleboNotificationRepository.markPhleboNotificationRead(phleboId, id);
  if (result.count > 0) return;

  if (!(await phleboNotificationRepository.existsForPhlebo(phleboId, id))) {
    throw ApiError.notFound("Notification not found");
  }
  // Row exists and was already read — idempotent success.
}

/** Returns how many rows this actually flipped, so the app can tell a real
 *  "cleared 12" from a no-op tap on an already-empty list. */
export async function markAllNotificationsRead(
  phleboId: string,
): Promise<{ marked_count: number }> {
  const result = await phleboNotificationRepository.markAllPhleboNotificationsRead(phleboId);
  return { marked_count: result.count };
}

export async function getUnreadCount(phleboId: string): Promise<{ unread_count: number }> {
  const unreadCount = await phleboNotificationRepository.countUnreadPhleboNotifications(phleboId);
  return { unread_count: unreadCount };
}
