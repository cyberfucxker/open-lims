import { prisma } from "../config/database";

/** Data access for the franchise portal's in-app notification list — the
 *  `phleboNotification.repository.ts` twin for this recipient. Every read
 *  here is scoped by `organizationId`, so one franchise can never see or
 *  mutate another's rows. */

export interface ListOrganizationNotificationsFilter {
  organizationId: string;
  skip: number;
  take: number;
}

export async function listOrganizationNotifications(filter: ListOrganizationNotificationsFilter) {
  const where = { organizationId: filter.organizationId };

  const [rows, total, unreadCount] = await Promise.all([
    prisma.organizationNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.organizationNotification.count({ where }),
    prisma.organizationNotification.count({
      where: { organizationId: filter.organizationId, isRead: false },
    }),
  ]);

  return { rows, total, unreadCount };
}

export function countUnreadOrganizationNotifications(organizationId: string) {
  return prisma.organizationNotification.count({ where: { organizationId, isRead: false } });
}

/** Marks one row read, but only if it belongs to this franchise AND is
 *  still unread. A count of 0 is ambiguous on its own (foreign/missing id,
 *  or already read) — `existsForOrganization` below is what tells those
 *  apart, so the service can 404 the first and treat the second as an
 *  idempotent success. */
export function markOrganizationNotificationRead(organizationId: string, id: string) {
  return prisma.organizationNotification.updateMany({
    where: { organizationId, id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function existsForOrganization(organizationId: string, id: string): Promise<boolean> {
  const count = await prisma.organizationNotification.count({ where: { organizationId, id } });
  return count > 0;
}

export function markAllOrganizationNotificationsRead(organizationId: string) {
  return prisma.organizationNotification.updateMany({
    where: { organizationId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
