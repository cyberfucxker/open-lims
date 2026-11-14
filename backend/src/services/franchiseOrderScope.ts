import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

/** An `AppOrder` belongs to a franchise if ANY of:
 *  1. it was placed directly through that franchise — `AppOrder.organizationId`,
 *     a booking-time snapshot only ever set for legacy/backfilled orders and
 *     the (not yet built) franchise walk-in booking flow; or
 *  2. the franchise is assigned to cover the order's resolved Area
 *     (`OrganizationServiceArea`) — the general case: a patient-web/app
 *     booking never stamps `organizationId` at all (it has no franchise
 *     concept), so area assignment is what actually routes those orders to
 *     the franchise operating that area; or
 *  3. the patient booked it by tapping "Book Now" on a "Nearest Lab" card
 *     (`AppOrder.serviceCenterId`) that's assigned to this franchise
 *     (`ServiceCenter.organizationId`) — overrides reason 2 for that one
 *     booking regardless of whether the patient's address area otherwise
 *     matches a different franchise, since the patient explicitly picked
 *     this lab.
 *
 *  One shared fragment for all three reasons, used everywhere an AppOrder
 *  query is scoped to a franchise (`appOrder.repository.ts`'s list/detail,
 *  every `franchiseDashboard.service.ts` query) — so no query can drift and
 *  show a different order set than another. */
export function franchiseOrderScope(organizationId: string): Prisma.AppOrderWhereInput {
  return {
    OR: [
      { organizationId },
      { area: { organizations: { some: { organizationId } } } },
      { serviceCenter: { organizationId } },
    ],
  };
}

/** Post-fetch equivalent of `franchiseOrderScope`, for call sites (like
 *  `getAppOrderDetail`'s ownership check) that already have the order row in
 *  hand rather than building a where-clause. */
export async function isOrderVisibleToOrganization(
  order: { organizationId: string | null; areaId: string | null; serviceCenterId: string | null },
  organizationId: string,
): Promise<boolean> {
  if (order.organizationId === organizationId) return true;
  if (order.serviceCenterId) {
    const center = await prisma.serviceCenter.findUnique({
      where: { id: order.serviceCenterId },
      select: { organizationId: true },
    });
    if (center?.organizationId === organizationId) return true;
  }
  if (!order.areaId) return false;
  const assignment = await prisma.organizationServiceArea.findUnique({
    where: { organizationId_areaId: { organizationId, areaId: order.areaId } },
  });
  return assignment !== null;
}

/** The reverse direction of `isOrderVisibleToOrganization` — given an
 *  order, every franchise it actually belongs to, by the same three reasons
 *  (direct stamp / area assignment / service-center), rather than checking
 *  one candidate. Reason 2 can genuinely return more than one franchise:
 *  the same Area can be assigned to several `Organization`s (see
 *  `OrganizationServiceArea`'s doc-comment), and all of them should hear
 *  about a booking that lands there — used by
 *  `organizationNotification.service.ts#notifyFranchisesOfNewBooking` right
 *  after a real (non-draft) order is confirmed, so "which franchise does
 *  this belong to" is no longer purely a query-time question. */
export async function resolveOwningOrganizationIds(order: {
  organizationId: string | null;
  areaId: string | null;
  serviceCenterId: string | null;
}): Promise<string[]> {
  const organizationIds = new Set<string>();

  if (order.organizationId) {
    organizationIds.add(order.organizationId);
  }
  if (order.serviceCenterId) {
    const center = await prisma.serviceCenter.findUnique({
      where: { id: order.serviceCenterId },
      select: { organizationId: true },
    });
    if (center?.organizationId) {
      organizationIds.add(center.organizationId);
    }
  }
  if (order.areaId) {
    const assignments = await prisma.organizationServiceArea.findMany({
      where: { areaId: order.areaId },
      select: { organizationId: true },
    });
    for (const assignment of assignments) {
      organizationIds.add(assignment.organizationId);
    }
  }

  return [...organizationIds];
}
