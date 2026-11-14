import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import * as organizationNotificationRepository from "../repositories/organizationNotification.repository";
import { resolveOwningOrganizationIds } from "./franchiseOrderScope";

/**
 * A franchise's in-app "New Booking" alert — written the moment a real
 * (non-draft) order resolves to one or more franchises, via the same
 * area/service-center/direct-stamp matching `franchiseOrderScope.ts` uses
 * everywhere else.
 *
 * The matching SMS (DLT template `Order_Received_Admin`, to the franchise
 * and head office) is sent by `orderSms.service.ts#smsOnOrderConfirmed`,
 * which the same callers fire right after this.
 */
export async function notifyFranchisesOfNewBooking(order: {
  id: string;
  orderNumber: string;
  organizationId: string | null;
  areaId: string | null;
  serviceCenterId: string | null;
}): Promise<void> {
  const organizationIds = await resolveOwningOrganizationIds(order);
  if (organizationIds.length === 0) return;

  await prisma.organizationNotification.createMany({
    data: organizationIds.map((organizationId) => ({
      organizationId,
      type: "NEW_BOOKING" as const,
      title: "New booking",
      message: `A new booking has come in — ${order.orderNumber}.`,
      targetId: order.id,
    })),
  });
}

// ---------------------------------------------------------------------------
// Franchise portal's own read/mark-read side — the
// `phlebo/notification.service.ts` twin for this recipient.
// ---------------------------------------------------------------------------

export interface OrganizationNotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface OrganizationNotificationListResult {
  rows: OrganizationNotificationDto[];
  unreadCount: number;
  page: number;
  totalPages: number;
  total: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export async function listOwnNotifications(
  organizationId: string,
  params: { page?: number; pageSize?: number },
): Promise<OrganizationNotificationListResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total, unreadCount } =
    await organizationNotificationRepository.listOrganizationNotifications({
      organizationId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

  return {
    rows: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      targetId: row.targetId,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    })),
    unreadCount,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    total,
  };
}

/** Marking an already-read notification read again is a success, not an
 *  error — the portal fires this on click and shouldn't have to track which
 *  rows it has already reported. An id that isn't this franchise's (or
 *  doesn't exist) 404s; the two cases are indistinguishable on purpose, so a
 *  guessed id can't confirm another franchise's notification exists. */
export async function markOwnNotificationRead(organizationId: string, id: string): Promise<void> {
  const result = await organizationNotificationRepository.markOrganizationNotificationRead(
    organizationId,
    id,
  );
  if (result.count > 0) return;

  if (!(await organizationNotificationRepository.existsForOrganization(organizationId, id))) {
    throw ApiError.notFound("Notification not found");
  }
  // Row exists and was already read — idempotent success.
}

export async function markAllOwnNotificationsRead(
  organizationId: string,
): Promise<{ markedCount: number }> {
  const result =
    await organizationNotificationRepository.markAllOrganizationNotificationsRead(organizationId);
  return { markedCount: result.count };
}
