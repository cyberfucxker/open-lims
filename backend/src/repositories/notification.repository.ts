import type { AppNotificationType } from "@prisma/client";
import { prisma } from "../config/database";

export interface ListNotificationsFilter {
  appUserId: string;
  isRead?: boolean;
  type?: AppNotificationType;
  skip: number;
  take: number;
}

export async function listNotifications(filter: ListNotificationsFilter) {
  const where = {
    appUserId: filter.appUserId,
    ...(filter.isRead !== undefined ? { isRead: filter.isRead } : {}),
    ...(filter.type ? { type: filter.type } : {}),
  };

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.notification.count({ where }),
    // Total unread across ALL pages/filters for this user — the bell-badge
    // count, deliberately not scoped to `isRead`/`type` the way `total` is.
    prisma.notification.count({ where: { appUserId: filter.appUserId, isRead: false } }),
  ]);

  return { rows, total, unreadCount };
}

export function createNotification(data: {
  appUserId: string;
  type: AppNotificationType;
  title: string;
  message: string;
  imageUrl?: string | null;
  targetId?: string | null;
}) {
  return prisma.notification.create({ data });
}

/** Marks exactly the ids that both exist AND belong to `appUserId` —
 *  silently drops the rest rather than 404ing, matching the spec's "no 403
 *  leak" rule (a mixed-ownership request must not reveal which ids weren't
 *  theirs). Re-marking an already-read row is a no-op, not an error. */
export function markNotificationsRead(appUserId: string, ids: string[]) {
  return prisma.notification.updateMany({
    where: { appUserId, id: { in: ids }, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

/** How many of `ids` actually exist and belong to this user — regardless of
 *  their current `isRead` state. Used to tell "nothing matched (0 count on
 *  the update, but genuinely bad/foreign ids)" apart from "nothing matched
 *  because they were already read" (idempotent success, not a 404). */
export function countOwnedNotifications(appUserId: string, ids: string[]) {
  return prisma.notification.count({ where: { appUserId, id: { in: ids } } });
}

export function markAllNotificationsRead(appUserId: string) {
  return prisma.notification.updateMany({
    where: { appUserId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export function getNotificationPreference(appUserId: string) {
  return prisma.appUser.findUnique({ where: { id: appUserId }, select: { pushEnabled: true } });
}

export function setNotificationPreference(appUserId: string, pushEnabled: boolean) {
  return prisma.appUser.update({ where: { id: appUserId }, data: { pushEnabled } });
}
