import type { PhleboNotificationType } from "@prisma/client";
import { prisma } from "../config/database";

/** Data access for the phlebo app's in-app notification list — the
 *  `notification.repository.ts` twin for the other recipient (see
 *  `PhleboNotification`'s schema doc-comment for why the two are separate
 *  tables rather than one polymorphic one). Every read here is scoped by
 *  `phleboId`, so one phlebo can never see or mutate another's rows. */

export interface ListPhleboNotificationsFilter {
  phleboId: string;
  isRead?: boolean;
  type?: PhleboNotificationType;
  skip: number;
  take: number;
}

export async function listPhleboNotifications(filter: ListPhleboNotificationsFilter) {
  const where = {
    phleboId: filter.phleboId,
    ...(filter.isRead !== undefined ? { isRead: filter.isRead } : {}),
    ...(filter.type ? { type: filter.type } : {}),
  };

  const [rows, total, unreadCount] = await Promise.all([
    prisma.phleboNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.phleboNotification.count({ where }),
    // The bell-badge count: every unread row for this phlebo, deliberately
    // NOT narrowed by the `isRead`/`type` filters that shape `total`.
    prisma.phleboNotification.count({ where: { phleboId: filter.phleboId, isRead: false } }),
  ]);

  return { rows, total, unreadCount };
}

export function countUnreadPhleboNotifications(phleboId: string) {
  return prisma.phleboNotification.count({ where: { phleboId, isRead: false } });
}

export function createPhleboNotification(data: {
  phleboId: string;
  type: PhleboNotificationType;
  title: string;
  message: string;
  targetId?: string | null;
}) {
  return prisma.phleboNotification.create({ data });
}

/** Marks one row read, but only if it belongs to this phlebo AND is still
 *  unread. A count of 0 is ambiguous on its own (foreign/missing id, or
 *  already read) — `existsForPhlebo` below is what tells those apart, so the
 *  service can 404 the first and treat the second as an idempotent success. */
export function markPhleboNotificationRead(phleboId: string, id: string) {
  return prisma.phleboNotification.updateMany({
    where: { phleboId, id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function existsForPhlebo(phleboId: string, id: string): Promise<boolean> {
  const count = await prisma.phleboNotification.count({ where: { phleboId, id } });
  return count > 0;
}

export function markAllPhleboNotificationsRead(phleboId: string) {
  return prisma.phleboNotification.updateMany({
    where: { phleboId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
