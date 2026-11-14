import type { AppOrderStatus, AppPaymentMode, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { franchiseOrderScope } from "../services/franchiseOrderScope";
import { computeAge } from "./patient.repository";
import { fromDbGender, toRelationLabel } from "../utils/enumMappers";
import type {
  AppOrderDetailDto,
  AppOrderListItem,
  AppOrderTimelineEventDto,
} from "../types/appOrder.types";

export interface ListAppOrdersFilter {
  search?: string;
  status?: AppOrderStatus;
  /** Franchise scope. Set ONLY from `req.franchise.organizationId`, never from
   *  client input — it is what keeps one franchise out of another's orders. */
  organizationId?: string;
  phleboId?: string;
  paymentMode?: AppPaymentMode;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  skip: number;
  take: number;
}

const appOrderListInclude = {
  appUser: { select: { id: true, name: true, mobile: true } },
  address: { select: { city: true } },
  slot: true,
  slotTemplate: true,
  phlebotomist: { select: { id: true, name: true } },
  items: { select: { name: true } },
} satisfies Prisma.AppOrderInclude;

const appOrderDetailInclude = {
  appUser: { select: { id: true, name: true, mobile: true, email: true, fcmToken: true } },
  address: true,
  slot: true,
  slotTemplate: true,
  phlebotomist: true,
  // `familyMember.patient` on both: an order can cover several people, and
  // the admin needs to see whose sample each line is (see AppOrderItemDto).
  items: { include: { familyMember: { include: { patient: true } } } },
  appointments: {
    include: {
      appointment: { include: { tests: true } },
      familyMember: { include: { patient: true } },
    },
  },
  // Only set on a HOME_VISIT order, and only before the phlebo has added
  // tests (i.e. before `appointments`/`items` exist to carry the same link)
  // — see AppOrder.homeVisitFamilyMemberId's doc-comment.
  homeVisitFamilyMember: { include: { patient: true } },
  statusHistory: { orderBy: { changedAt: "asc" } },
} satisfies Prisma.AppOrderInclude;

type AppOrderListRow = Prisma.AppOrderGetPayload<{ include: typeof appOrderListInclude }>;
type AppOrderDetailRow = Prisma.AppOrderGetPayload<{ include: typeof appOrderDetailInclude }>;

/** Maps a list row to the exact shape the Order Management list screen needs. */
export function toAppOrderListItemDto(order: AppOrderListRow): AppOrderListItem {
  const itemNames = [...new Set(order.items.map((item) => item.name))];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.appUser.name,
    customerMobile: order.appUser.mobile,
    city: order.address?.city ?? null,
    itemSummary: itemNames.join(", "),
    phlebotomist: order.phlebotomist
      ? { id: order.phlebotomist.id, name: order.phlebotomist.name }
      : null,
    slotLabel: order.slot
      ? `${order.slot.startTime} - ${order.slot.endTime}`
      : order.slotTemplate
        ? `${order.slotTemplate.startTime} - ${order.slotTemplate.endTime}`
        : null,
    platform: order.platform ?? "WEB",
    orderType: order.orderType,
    status: order.status,
    totalPayable: Number(order.totalPayable),
    paymentMode: order.paymentMode,
    paymentStatus: order.paymentStatus,
    orderDate: order.orderDate.toISOString().slice(0, 10),
    createdAt: placedAt(order),
  };
}

/** When the patient actually placed the order. An order starts life as a
 *  Review-Cart draft and is only placed at confirmation, sometimes days
 *  later — `createdAt` is when that draft row appeared, not the order. */
function placedAt(order: { confirmedAt: Date | null; createdAt: Date }): string {
  return (order.confirmedAt ?? order.createdAt).toISOString();
}

/** Labels for the phlebo-workflow statuses `AppOrderStatusHistory` actually
 *  tracks — `PENDING`/`CONFIRMED` (covered by `createdAt`/`confirmedAt`) and
 *  `CANCELLED` (covered by `cancelledAt`) are deliberately absent here; see
 *  `recordAppOrderStatusHistory`'s doc-comment for why. */
const STATUS_TIMELINE_LABEL: Partial<Record<AppOrderStatus, string>> = {
  ACCEPTED: "Phlebo Accepted",
  STARTED_JOURNEY: "Phlebo Started Journey",
  REACHED: "Phlebo Reached",
  SAMPLE_COLLECTED: "Sample Collected",
  SAMPLE_DROPPED: "Sample Dropped at Lab",
  COMPLETED: "Order Completed",
  REJECTED: "Phlebo Rejected",
};

/** Maps a detail row to the full Order Detail screen shape — this is the
 *  endpoint that finally populates a real `phlebotomist` object instead of
 *  the patient app's hardcoded null (see `app/order.service.ts#getOrderDetail`). */
export function toAppOrderDetailDto(order: AppOrderDetailRow): AppOrderDetailDto {
  const timeline: AppOrderTimelineEventDto[] = [
    { label: "Order Created", at: order.createdAt.toISOString() },
  ];
  if (order.confirmedAt) {
    timeline.push({ label: "Order Confirmed", at: order.confirmedAt.toISOString() });
  }
  if (order.cancelledAt) {
    timeline.push({ label: "Order Cancelled", at: order.cancelledAt.toISOString() });
  }
  for (const change of order.statusHistory) {
    const label = STATUS_TIMELINE_LABEL[change.status];
    if (!label) continue;
    const suffix =
      change.source === "ADMIN"
        ? " (by admin)"
        : change.source === "FRANCHISE"
          ? " (by franchise)"
          : "";
    timeline.push({ label: `${label}${suffix}`, at: change.changedAt.toISOString() });
  }
  timeline.sort((a, b) => a.at.localeCompare(b.at));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: {
      id: order.appUser.id,
      name: order.appUser.name,
      mobile: order.appUser.mobile,
      email: order.appUser.email,
    },
    address: order.address
      ? {
          id: order.address.id,
          type: order.address.type,
          houseNo: order.address.houseNo,
          apartment: order.address.apartment,
          address: order.address.address,
          locality: order.address.locality,
          landmark: order.address.landmark,
          city: order.address.city,
          state: order.address.state,
          pincode: order.address.pincode,
          phone: order.address.phone,
          latitude: order.address.latitude ? Number(order.address.latitude) : null,
          longitude: order.address.longitude ? Number(order.address.longitude) : null,
          isDefault: order.address.isDefault,
        }
      : null,
    slot: order.slot
      ? {
          id: order.slot.id,
          slotDate: order.slot.slotDate.toISOString().slice(0, 10),
          startTime: order.slot.startTime,
          endTime: order.slot.endTime,
        }
      : order.slotTemplate
        ? {
            id: order.slotTemplate.id,
            slotDate: order.orderDate.toISOString().slice(0, 10),
            startTime: order.slotTemplate.startTime,
            endTime: order.slotTemplate.endTime,
          }
        : null,
    phlebotomist: order.phlebotomist
      ? {
          id: order.phlebotomist.id,
          name: order.phlebotomist.name,
          mobile: order.phlebotomist.mobile,
          photoUrl: order.phlebotomist.photoUrl,
        }
      : null,
    status: order.status,
    orderType: order.orderType,
    symptomNotes: order.symptomNotes,
    homeVisitFamilyMember: order.homeVisitFamilyMember
      ? {
          familyMemberId: order.homeVisitFamilyMember.id,
          name: `${order.homeVisitFamilyMember.patient.firstName} ${order.homeVisitFamilyMember.patient.lastName}`.trim(),
          relation: toRelationLabel(order.homeVisitFamilyMember.relation),
        }
      : null,
    paymentMode: order.paymentMode,
    paymentStatus: order.paymentStatus,
    servicePin: order.servicePin,
    subtotal: Number(order.subtotal),
    phlebotomyCharges: Number(order.phlebotomyCharges),
    walletDiscount: Number(order.walletDiscount),
    couponDiscount: Number(order.couponDiscount),
    totalPayable: Number(order.totalPayable),
    patients: order.appointments.map((row) => ({
      familyMemberId: row.familyMemberId,
      name: `${row.familyMember.patient.firstName} ${row.familyMember.patient.lastName}`.trim(),
      relation: toRelationLabel(row.familyMember.relation),
      age: computeAge(row.familyMember.patient.dob),
      gender: fromDbGender(row.familyMember.patient.gender),
      mobile: row.familyMember.patient.mobile,
    })),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.itemType === "TEST" ? "Test" : "Package",
      price: Number(item.price),
      familyMemberId: item.familyMemberId,
      patientName:
        `${item.familyMember.patient.firstName} ${item.familyMember.patient.lastName}`.trim(),
      relation: toRelationLabel(item.familyMember.relation),
    })),
    timeline,
    createdAt: placedAt(order),
  };
}

function buildWhere(
  filter: Pick<
    ListAppOrdersFilter,
    | "search"
    | "status"
    | "organizationId"
    | "phleboId"
    | "paymentMode"
    | "paymentStatus"
    | "dateFrom"
    | "dateTo"
  >,
): Prisma.AppOrderWhereInput {
  const where: Prisma.AppOrderWhereInput = { isDraft: false };
  // `franchiseOrderScope` and the search below both need their own `OR` —
  // AND-ed together via `where.AND` so neither clobbers the other (a single
  // `where.OR =` assignment would silently drop whichever was set first).
  const and: Prisma.AppOrderWhereInput[] = [];

  if (filter.organizationId) {
    and.push(franchiseOrderScope(filter.organizationId));
  }

  if (filter.search) {
    and.push({
      OR: [
        { orderNumber: { contains: filter.search, mode: "insensitive" } },
        { appUser: { is: { name: { contains: filter.search, mode: "insensitive" } } } },
        { appUser: { is: { mobile: { contains: filter.search } } } },
      ],
    });
  }
  if (and.length > 0) {
    where.AND = and;
  }

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.phleboId === "unassigned") {
    where.phleboId = null;
  } else if (filter.phleboId) {
    where.phleboId = filter.phleboId;
  }
  if (filter.paymentMode) {
    where.paymentMode = filter.paymentMode;
  }
  if (filter.paymentStatus) {
    where.paymentStatus = filter.paymentStatus;
  }
  if (filter.dateFrom || filter.dateTo) {
    where.orderDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  return where;
}

export async function listAppOrders(
  filter: ListAppOrdersFilter,
): Promise<{ rows: AppOrderListRow[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.appOrder.findMany({
      where,
      include: appOrderListInclude,
      orderBy: [{ confirmedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.appOrder.count({ where }),
  ]);

  return { rows, total };
}

export function findAppOrderById(id: string) {
  return prisma.appOrder.findUnique({ where: { id }, include: appOrderDetailInclude });
}

export function updateAppOrderStatus(
  id: string,
  status: AppOrderStatus,
  extra: { cancelledAt?: Date } = {},
) {
  return prisma.appOrder.update({
    where: { id },
    data: { status, ...extra },
    include: appOrderDetailInclude,
  });
}

const TRACKED_HISTORY_STATUSES: ReadonlySet<AppOrderStatus> = new Set(
  Object.keys(STATUS_TIMELINE_LABEL) as AppOrderStatus[],
);

/** Writes one `AppOrderStatusHistory` row for a status change — called by
 *  `appOrder.service.ts#updateAppOrderStatus` (source `"ADMIN"` or, when a
 *  franchise made the change, `"FRANCHISE"`) and
 *  `phlebo/booking.service.ts#updateBookingStatus` (source `"PHLEBO"`) right
 *  after their own `prisma.appOrder.update` succeeds, so no caller can
 *  disagree about which statuses get a history row — a no-op for
 *  `PENDING`/`CONFIRMED`/`CANCELLED`, which the Order Detail timeline
 *  already derives from `createdAt`/`confirmedAt`/`cancelledAt` instead
 *  (see `STATUS_TIMELINE_LABEL`'s doc-comment). */
export function recordAppOrderStatusHistory(
  orderId: string,
  status: AppOrderStatus,
  source: "ADMIN" | "PHLEBO" | "FRANCHISE",
) {
  if (!TRACKED_HISTORY_STATUSES.has(status)) {
    return Promise.resolve(undefined);
  }
  return prisma.appOrderStatusHistory.create({ data: { orderId, status, source } });
}

export function updateAppOrderPhlebo(id: string, phleboId: string | null) {
  return prisma.appOrder.update({
    where: { id },
    data: { phleboId },
    include: appOrderDetailInclude,
  });
}

export function deleteAppOrder(id: string) {
  return prisma.appOrder.delete({ where: { id } });
}

// --- Manual order creation (admin "book on behalf of a patient") ---
// These read helpers exist here (rather than on a dedicated AppUser/Address/
// Slot repository, which don't exist yet) because this module is the only
// caller that needs them for now — same convention as `app/order.service.ts`
// resolving these directly against `prisma`.

export function findAppUserById(id: string) {
  return prisma.appUser.findUnique({ where: { id } });
}

export function findFamilyMemberById(id: string) {
  return prisma.familyMember.findUnique({ where: { id } });
}

export function findSelfFamilyMember(appUserId: string) {
  return prisma.familyMember.findFirst({ where: { appUserId, relation: "SELF" } });
}

export function findAddressById(id: string) {
  return prisma.address.findUnique({ where: { id } });
}

export function findSlotById(id: string) {
  return prisma.slot.findUnique({ where: { id } });
}

export function findSlotByIdTx(id: string, tx: Prisma.TransactionClient) {
  return tx.slot.findUnique({ where: { id } });
}

export function incrementSlotBooked(id: string, tx: Prisma.TransactionClient) {
  return tx.slot.update({ where: { id }, data: { bookedCount: { increment: 1 } } });
}

export interface CreateAppOrderRowInput {
  orderNumber: string;
  appUserId: string;
  addressId: string;
  slotId: string | null;
  orderDate: Date;
  subtotal: number;
  totalPayable: number;
  paymentMode: AppPaymentMode;
  paymentStatus: "PAID" | "PARTIAL" | "PENDING";
  servicePin: string;
  /** Stamped only when a franchise placed this order directly from its own
   *  portal — see `franchiseOrderScope.ts`'s doc-comment, reason 1. Null for
   *  every other manual-create caller (admin). */
  organizationId?: string | null;
}

/** Always called from within the caller's transaction, right after the real
 *  Appointment + Bill it wraps — mirrors `app/order.service.ts#confirmOrder`'s
 *  own `tx.appOrder.update` call, just a `create` for the admin manual-order
 *  path since no draft row exists yet. */
export function createAppOrderRow(data: CreateAppOrderRowInput, tx: Prisma.TransactionClient) {
  return tx.appOrder.create({
    data: {
      orderNumber: data.orderNumber,
      appUserId: data.appUserId,
      addressId: data.addressId,
      slotId: data.slotId,
      orderDate: data.orderDate,
      isDraft: false,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      subtotal: data.subtotal,
      totalPayable: data.totalPayable,
      paymentMode: data.paymentMode,
      paymentStatus: data.paymentStatus,
      servicePin: data.servicePin,
      organizationId: data.organizationId ?? undefined,
    },
  });
}

export function createAppOrderAppointmentRow(
  data: { orderId: string; appointmentId: string; familyMemberId: string },
  tx: Prisma.TransactionClient,
) {
  return tx.appOrderAppointment.create({ data });
}

export function countAppOrderAppointments(orderId: string) {
  return prisma.appOrderAppointment.count({ where: { orderId } });
}
