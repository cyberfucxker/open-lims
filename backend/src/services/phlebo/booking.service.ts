import type { AppOrder, AppOrderStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import * as appOrderRepository from "../../repositories/appOrder.repository";
import { settleAppOrderBills } from "../app/paymentFinalize.service";
import { addHomeVisitItems, removeHomeVisitItem } from "../appOrder.service";
import {
  notifyPhleboAccepted,
  notifyPhleboOnTheWay,
  notifyPhleboReached,
  notifyPhleboReassigning,
  notifySampleCollected,
  notifySampleDropped,
} from "../orderNotification.service";
import {
  formatOneLineAddress,
  formatTimeSlot,
  nextActions,
  STATUS_LABEL,
  STATUS_SLUG,
  statusFromSlug,
  toPaymentStatusSlug,
} from "./booking.util";

const BOOKING_INCLUDE = {
  address: true,
  slot: true,
  // Cities on the new Slot Template system (`useNewSlotSystem`) book against
  // `slotTemplateId` and leave `slotId` null — without this, `time_slot` is
  // always null for those orders.
  slotTemplate: true,
  appointments: {
    include: {
      familyMember: { include: { patient: true } },
      appointment: { include: { tests: true, samples: true } },
    },
  },
  // Only set on a HOME_VISIT booking, and only before `appointments` exists
  // to carry the same patient — see AppOrder.homeVisitFamilyMemberId's
  // doc-comment in schema.prisma.
  homeVisitFamilyMember: { include: { patient: true } },
} as const;

type BookingWithRelations = AppOrder & {
  address: {
    houseNo: string | null;
    apartment: string | null;
    address: string;
    locality: string | null;
    landmark: string | null;
    city: string;
    latitude: unknown;
    longitude: unknown;
  } | null;
  slot: { startTime: string; endTime: string } | null;
  slotTemplate: { startTime: string; endTime: string } | null;
  appointments: Array<{
    familyMember: { patient: { firstName: string; lastName: string; mobile: string } };
    appointment: {
      tests: Array<{ id: string; testId: string; testName: string; price: unknown }>;
      samples: Array<{ sampleNo: string }>;
    };
  }>;
  homeVisitFamilyMember: {
    patient: { firstName: string; lastName: string; mobile: string };
  } | null;
};

export interface BookingDto {
  id: string;
  order_number: string;
  patient_name: string;
  patient_phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  time_slot: string | null;
  tests_count: number;
  amount: number;
  payment_status: string;
  payment_method: string;
  cod_payment_status: string;
  can_mark_cod_collected: boolean;
  status: string;
  status_label: string;
  next_actions: string[];
  barcode_number: string | null;
  pin_required: boolean;
  pin_verified: boolean;
  collection_date: string;
  remarks: string;
  tests: Array<{ id: string; name: string; price: number }>;
  /** "home_visit" = booked with a symptom, no tests chosen yet — the app
   *  should show `symptom_notes` and the "add tests" action instead of a
   *  test list until `tests` is non-empty. "catalog" is every pre-existing
   *  booking, unchanged. */
  order_type: "catalog" | "home_visit";
  symptom_notes: string | null;
}

function resolveTimeSlot(order: BookingWithRelations): string | null {
  const slot = order.slotTemplate ?? order.slot;
  return slot ? formatTimeSlot(slot.startTime, slot.endTime) : null;
}

export function toBookingDto(order: BookingWithRelations): BookingDto {
  const firstAppointment = order.appointments[0];
  const patient = firstAppointment?.familyMember.patient ?? order.homeVisitFamilyMember?.patient;
  const tests = order.appointments.flatMap((a) => a.appointment.tests);
  const firstSample = order.appointments
    .flatMap((a) => a.appointment.samples)
    .find((s) => s.sampleNo);

  const isCash = order.paymentMode === "CASH";

  return {
    id: order.id,
    order_number: order.orderNumber,
    patient_name: patient ? `${patient.firstName} ${patient.lastName}`.trim() : "",
    patient_phone: patient?.mobile ?? "",
    address: order.address ? formatOneLineAddress(order.address) : "",
    latitude: order.address?.latitude != null ? Number(order.address.latitude) : null,
    longitude: order.address?.longitude != null ? Number(order.address.longitude) : null,
    time_slot: resolveTimeSlot(order),
    tests_count: tests.length,
    amount: Number(order.totalPayable),
    payment_status: toPaymentStatusSlug(order.paymentStatus),
    payment_method: isCash ? "cod" : "online",
    cod_payment_status: isCash && order.codCollectedAt ? "cod_collected" : "",
    can_mark_cod_collected:
      isCash &&
      !order.codCollectedAt &&
      order.status !== "CANCELLED" &&
      order.status !== "REJECTED",
    status: STATUS_SLUG[order.status],
    status_label: STATUS_LABEL[order.status],
    next_actions: nextActions(order.status),
    barcode_number: firstSample?.sampleNo ?? null,
    pin_required: order.servicePin !== null,
    pin_verified: order.pinVerifiedAt !== null,
    collection_date: order.orderDate.toISOString().slice(0, 10),
    remarks: order.phleboRemarks ?? "",
    tests: tests.map((t) => ({ id: t.id, name: t.testName, price: Number(t.price) })),
    order_type: order.orderType === "HOME_VISIT" ? "home_visit" : "catalog",
    symptom_notes: order.symptomNotes,
  };
}

export interface BookingListResult {
  bookings: BookingDto[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface ListBookingsParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

async function listBookingsWhere(
  phleboId: string,
  where: Record<string, unknown>,
  page: number,
  perPage: number,
): Promise<BookingListResult> {
  const fullWhere = { phleboId, isDraft: false, ...where };

  const [rows, total] = await Promise.all([
    prisma.appOrder.findMany({
      where: fullWhere,
      include: BOOKING_INCLUDE,
      orderBy: { orderDate: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.appOrder.count({ where: fullWhere }),
  ]);

  return {
    bookings: rows.map((r) => toBookingDto(r as BookingWithRelations)),
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    total,
  };
}

const DEFAULT_PER_PAGE = 100;

export async function listBookings(
  phleboId: string,
  params: ListBookingsParams,
): Promise<BookingListResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.perPage && params.perPage > 0 ? params.perPage : DEFAULT_PER_PAGE;

  const where: Record<string, unknown> = {};
  if (params.status) {
    const status = statusFromSlug(params.status);
    if (status) where.status = status;
  }
  if (params.dateFrom || params.dateTo) {
    where.orderDate = {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
    };
  }

  return listBookingsWhere(phleboId, where, page, perPage);
}

function todayRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function listTodayBookings(phleboId: string): Promise<BookingListResult> {
  const { start, end } = todayRange();
  return listBookingsWhere(phleboId, { orderDate: { gte: start, lt: end } }, 1, DEFAULT_PER_PAGE);
}

const TERMINAL_STATUSES: AppOrderStatus[] = ["COMPLETED", "CANCELLED", "REJECTED"];

export async function listUpcomingBookings(phleboId: string): Promise<BookingListResult> {
  const { start } = todayRange();
  return listBookingsWhere(
    phleboId,
    { orderDate: { gte: start }, status: { notIn: TERMINAL_STATUSES } },
    1,
    DEFAULT_PER_PAGE,
  );
}

export async function listCompletedBookings(phleboId: string): Promise<BookingListResult> {
  return listBookingsWhere(phleboId, { status: "COMPLETED" }, 1, DEFAULT_PER_PAGE);
}

export async function listCancelledBookings(phleboId: string): Promise<BookingListResult> {
  return listBookingsWhere(
    phleboId,
    { status: { in: ["CANCELLED", "REJECTED"] } },
    1,
    DEFAULT_PER_PAGE,
  );
}

/** Samples the phlebo has already collected from the patient but not yet
 *  dropped off at the lab/collection point — what they're still physically
 *  carrying. The only legal next action from here is `sample_dropped` (see
 *  `NEXT_ACTIONS` in booking.util.ts). */
export async function listPendingDropBookings(phleboId: string): Promise<BookingListResult> {
  return listBookingsWhere(phleboId, { status: "SAMPLE_COLLECTED" }, 1, DEFAULT_PER_PAGE);
}

async function findOwnedBooking(
  phleboId: string,
  bookingId: string,
): Promise<BookingWithRelations> {
  const order = await prisma.appOrder.findUnique({
    where: { id: bookingId },
    include: BOOKING_INCLUDE,
  });

  if (!order || order.isDraft || order.phleboId !== phleboId) {
    throw ApiError.notFound("Booking not found");
  }

  return order as BookingWithRelations;
}

export async function getBookingDetail(phleboId: string, bookingId: string): Promise<BookingDto> {
  const order = await findOwnedBooking(phleboId, bookingId);
  return toBookingDto(order);
}

/** Card-sized view for the dashboard's "today" list — the full booking
 *  (tests, packages, PIN/COD flags, actions) comes from the details endpoint. */
export interface BookingSummaryDto {
  id: string;
  order_number: string;
  patient_name: string;
  status: string;
  status_label: string;
  time_slot: string | null;
  amount: number;
  address: string;
  collection_date: string;
  order_type: BookingDto["order_type"];
  order_type_label: "Home Visit" | "Home Collection";
}

export function toBookingSummary(booking: BookingDto): BookingSummaryDto {
  return {
    id: booking.id,
    order_number: booking.order_number,
    patient_name: booking.patient_name,
    status: booking.status,
    status_label: booking.status_label,
    time_slot: booking.time_slot,
    amount: booking.amount,
    address: booking.address,
    collection_date: booking.collection_date,
    order_type: booking.order_type,
    order_type_label: booking.order_type === "home_visit" ? "Home Visit" : "Home Collection",
  };
}

export interface DetailParameter {
  id: string;
  name: string;
  unit: string | null;
}

export interface DetailTest {
  id: string;
  name: string;
  price: number | null;
  parameters: DetailParameter[];
  /** The `AppOrderItem` row backing this line — only set when this test was
   *  booked standalone (not as one of a package's tests, which have no item
   *  of their own to remove). Pass this to the remove-item endpoint. Absent
   *  on orders placed before `AppOrderItem` existed, which can't be edited
   *  through this endpoint either. */
  itemId?: string;
}

export interface DetailPackage {
  id: string;
  name: string;
  price: number;
  tests: DetailTest[];
  /** Parameters attached to the package directly, not via one of its tests. */
  parameters: DetailParameter[];
  /** The `AppOrderItem` row backing this package line — pass this to the
   *  remove-item endpoint to drop the whole package. */
  itemId: string;
}

export type BookingFullDetailDto = Omit<BookingDto, "tests"> & {
  tests: DetailTest[];
  packages: DetailPackage[];
};

const TEST_WITH_PARAMETERS = {
  parameters: {
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { unit: true, parameter: { select: { id: true, name: true } } },
  },
} as const;

type TestWithParameters = {
  id: string;
  name: string;
  parameters: Array<{ unit: string | null; parameter: { id: string; name: string } }>;
};

function toDetailTest(test: TestWithParameters, price: number | null, itemId?: string): DetailTest {
  return {
    id: test.id,
    name: test.name,
    price,
    parameters: test.parameters.map((tp) => ({
      id: tp.parameter.id,
      name: tp.parameter.name,
      unit: tp.unit,
    })),
    itemId,
  };
}

/** Everything the phlebo app needs for one booking, with what the patient
 *  booked split into standalone tests and packages (each expandable to its
 *  tests → parameters), instead of the flattened appointment test list. */
export async function getBookingFullDetail(
  phleboId: string,
  bookingId: string,
): Promise<BookingFullDetailDto> {
  const order = await findOwnedBooking(phleboId, bookingId);
  const { tests: _flatTests, ...base } = toBookingDto(order);

  const items = await prisma.appOrderItem.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" },
  });

  // Orders placed before `AppOrderItem` existed only carry the flattened
  // appointment tests — show those as standalone tests rather than nothing.
  const bookedTests: Array<{ testId: string; price: unknown; itemId?: string }> =
    items.length > 0
      ? items
          .filter((i) => i.itemType === "TEST")
          .map((i) => ({ testId: i.itemId, price: i.price, itemId: i.id }))
      : order.appointments.flatMap((a) =>
          a.appointment.tests.map((t) => ({ testId: t.testId, price: t.price })),
        );
  const packageItems = items.filter((i) => i.itemType === "PACKAGE");

  const [tests, packages] = await Promise.all([
    prisma.test.findMany({
      where: { id: { in: bookedTests.map((t) => t.testId) } },
      select: { id: true, name: true, ...TEST_WITH_PARAMETERS },
    }),
    prisma.package.findMany({
      where: { id: { in: packageItems.map((i) => i.itemId) } },
      select: {
        id: true,
        name: true,
        packageTests: {
          select: { test: { select: { id: true, name: true, ...TEST_WITH_PARAMETERS } } },
        },
        packageParameters: { select: { parameter: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const testById = new Map(tests.map((t) => [t.id, t]));
  const packageById = new Map(packages.map((p) => [p.id, p]));

  const detailTests: DetailTest[] = bookedTests.flatMap((booked) => {
    const test = testById.get(booked.testId);
    return test ? [toDetailTest(test, Number(booked.price), booked.itemId)] : [];
  });

  const detailPackages: DetailPackage[] = packageItems.flatMap((item) => {
    const pkg = packageById.get(item.itemId);
    if (!pkg) return [];
    return [
      {
        id: pkg.id,
        name: pkg.name,
        price: Number(item.price),
        tests: pkg.packageTests.map((pt) => toDetailTest(pt.test, null)),
        parameters: pkg.packageParameters.map((pp) => ({
          id: pp.parameter.id,
          name: pp.parameter.name,
          unit: null,
        })),
        itemId: item.id,
      },
    ];
  });

  return { ...base, tests: detailTests, packages: detailPackages };
}

export interface AddBookingItemsInput {
  test_ids: string[];
  package_ids?: string[];
}

/** The phlebo's "here's what I'm testing for" call on a home-visit booking —
 *  see `appOrder.service.ts#addHomeVisitItems` for the actual Appointment/
 *  Bill/AppOrderItem creation and its ownership/status rules. Re-fetches
 *  through the normal booking path afterwards so the response is shaped
 *  exactly like every other Booking DTO, now with `tests` populated. */
export async function addItems(
  phleboId: string,
  bookingId: string,
  input: AddBookingItemsInput,
): Promise<BookingDto> {
  await addHomeVisitItems(
    bookingId,
    { testIds: input.test_ids, packageIds: input.package_ids },
    phleboId,
  );
  const order = await findOwnedBooking(phleboId, bookingId);
  return toBookingDto(order);
}

/** The mirror of `addItems` — drops one test/package the phlebo had added
 *  (by its `itemId`, as returned in `getBookingFullDetail`'s `tests`/
 *  `packages`), re-billing from whatever's left. See
 *  `appOrder.service.ts#removeHomeVisitItem`. */
export async function removeItem(
  phleboId: string,
  bookingId: string,
  itemId: string,
): Promise<BookingDto> {
  await removeHomeVisitItem(bookingId, itemId, phleboId);
  const order = await findOwnedBooking(phleboId, bookingId);
  return toBookingDto(order);
}

export interface UpdateBookingStatusInput {
  status: string;
  remarks?: string;
}

/** `latitude`/`longitude` on this endpoint (per phlebo.md) are for live
 *  location tracking — intentionally accepted-but-not-persisted, since no
 *  live-location table exists yet (noted as a separate future phase). */
export async function updateBookingStatus(
  phleboId: string,
  bookingId: string,
  input: UpdateBookingStatusInput,
  photoUrl?: string,
): Promise<BookingDto> {
  const order = await findOwnedBooking(phleboId, bookingId);

  const targetStatus = statusFromSlug(input.status);
  if (!targetStatus || !nextActions(order.status).includes(input.status)) {
    throw ApiError.badRequest(
      `Cannot move this booking from "${STATUS_SLUG[order.status]}" to "${input.status}"`,
    );
  }
  // Same hard gate as the admin side's equivalent check in
  // `appOrder.service.ts#updateAppOrderStatus` — the sample is the
  // patient's proof they paid COD, so it can't be collected while money is
  // still owed. `collectCod` (or an online payment settling) is what
  // clears this.
  if (targetStatus === "SAMPLE_COLLECTED" && order.paymentStatus !== "PAID") {
    throw ApiError.badRequest("Collect payment before marking the sample as collected");
  }

  const updated = await prisma.appOrder.update({
    where: { id: order.id },
    data: {
      status: targetStatus,
      phleboRemarks: input.remarks ?? undefined,
      phleboPhotoUrl: photoUrl ?? undefined,
      // Rejecting unassigns — lets admin reassign to another phlebo.
      phleboId: targetStatus === "REJECTED" ? null : undefined,
    },
    include: BOOKING_INCLUDE,
  });
  await appOrderRepository.recordAppOrderStatusHistory(order.id, targetStatus, "PHLEBO");

  // Every step of the phlebo's own journey the patient should hear about —
  // dispatch on whichever status this call just landed on.
  switch (targetStatus) {
    case "ACCEPTED":
      await notifyPhleboAccepted(updated.appUserId, updated.id, updated.orderNumber);
      break;
    case "STARTED_JOURNEY":
      await notifyPhleboOnTheWay(updated.appUserId, updated.id, updated.orderNumber);
      break;
    case "REACHED":
      await notifyPhleboReached(updated.appUserId, updated.id, updated.orderNumber);
      break;
    case "REJECTED":
      await notifyPhleboReassigning(updated.appUserId, updated.id, updated.orderNumber);
      break;
    case "SAMPLE_COLLECTED":
      await notifySampleCollected(updated.appUserId, updated.id, updated.orderNumber);
      break;
    case "SAMPLE_DROPPED":
      await notifySampleDropped(updated.appUserId, updated.id, updated.orderNumber);
      break;
  }

  return toBookingDto(updated as BookingWithRelations);
}

export async function verifyBookingPin(
  phleboId: string,
  bookingId: string,
  pin: string,
): Promise<BookingDto> {
  const order = await findOwnedBooking(phleboId, bookingId);

  if (!order.servicePin || order.servicePin !== pin) {
    throw ApiError.badRequest("Incorrect PIN");
  }

  const updated = await prisma.appOrder.update({
    where: { id: order.id },
    data: { pinVerifiedAt: new Date() },
    include: BOOKING_INCLUDE,
  });

  return toBookingDto(updated as BookingWithRelations);
}

export async function collectCod(
  phleboId: string,
  bookingId: string,
  remarks?: string,
): Promise<BookingDto> {
  const order = await findOwnedBooking(phleboId, bookingId);

  if (order.paymentMode !== "CASH") {
    throw ApiError.badRequest("This booking is not a cash-on-delivery order");
  }
  if (order.codCollectedAt) {
    throw ApiError.conflict("COD has already been collected for this booking");
  }

  // Settles every Bill under this order (Payment row + Bill amountPaid/dueAmount/
  // paymentStatus recompute) and marks the AppOrder itself PAID — same helper the
  // Razorpay online-payment path uses, so LIMS/Superadmin/Patient App all agree
  // this order is paid, not just `codCollectedAt` on the AppOrder row.
  await settleAppOrderBills(order.id, Number(order.totalPayable), "Cash");

  const updated = await prisma.appOrder.update({
    where: { id: order.id },
    data: {
      codCollectedAt: new Date(),
      phleboRemarks: remarks ?? undefined,
    },
    include: BOOKING_INCLUDE,
  });

  return toBookingDto(updated as BookingWithRelations);
}

/** Drops a single booking's sample — a thin, purpose-built wrapper around
 *  the generic status endpoint's logic (same "legal transition" check via
 *  `nextActions`, so this still only succeeds from `sample_collected`). */
export async function dropSample(
  phleboId: string,
  bookingId: string,
  remarks?: string,
): Promise<BookingDto> {
  return updateBookingStatus(phleboId, bookingId, { status: "sample_dropped", remarks });
}

export interface BulkDropFailure {
  id: string;
  reason: string;
}

export interface BulkDropResult {
  total: number;
  dropped_count: number;
  failed_count: number;
  bookings: BookingDto[];
  failed: BulkDropFailure[];
}

/** Drops each selected booking independently — one bad/ineligible id in the
 *  batch (already dropped, not owned by this phlebo, wrong status, etc.)
 *  never blocks the rest; the phlebo gets a clear per-item summary instead
 *  of an all-or-nothing failure. */
export async function bulkDropSamples(
  phleboId: string,
  bookingIds: string[],
  remarks?: string,
): Promise<BulkDropResult> {
  const uniqueIds = [...new Set(bookingIds)];
  const bookings: BookingDto[] = [];
  const failed: BulkDropFailure[] = [];

  for (const id of uniqueIds) {
    try {
      bookings.push(await dropSample(phleboId, id, remarks));
    } catch (error) {
      failed.push({
        id,
        reason: error instanceof ApiError ? error.message : "Failed to drop this booking",
      });
    }
  }

  return {
    total: uniqueIds.length,
    dropped_count: bookings.length,
    failed_count: failed.length,
    bookings,
    failed,
  };
}
