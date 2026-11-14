import { Prisma } from "@prisma/client";
import type { AppOrderStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { nextAppointmentNo, nextAppOrderNumber } from "../utils/idGenerator";
import * as appOrderRepository from "../repositories/appOrder.repository";
import { toAppOrderDetailDto, toAppOrderListItemDto } from "../repositories/appOrder.repository";
import * as appointmentRepository from "../repositories/appointment.repository";
import * as billRepository from "../repositories/bill.repository";
import * as phlebotomistRepository from "../repositories/phlebotomist.repository";
import { resolveTestsAndComputeBilling } from "./appointment.service";
import { expandToTestIds } from "./app/order.util";
import { createLinkedPatient } from "./app/patientLink.service";
import { isOrderVisibleToOrganization } from "./franchiseOrderScope";
import { toDbGender } from "../utils/enumMappers";
import {
  notifyBookingCancelledToPhlebo,
  notifyBookingUnassignedFromPhlebo,
  notifyNewAssignmentToPhlebo,
  notifyOrderCancelled,
  notifyOrderStatusChanged,
  notifyPhleboAssignedToPatient,
} from "./orderNotification.service";
import type {
  AddHomeVisitItemsInput,
  AppOrderDetailDto,
  CreateAppOrderInput,
  ListAppOrdersParams,
  ListAppOrdersResult,
} from "../types/appOrder.types";
import { smsOnOrderConfirmed, smsOnPhleboAssigned } from "./orderSms.service";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Order not found");
    }
    throw error;
  }
}

export async function listAppOrders(params: ListAppOrdersParams): Promise<ListAppOrdersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await appOrderRepository.listAppOrders({
    search: params.search,
    status: params.status,
    organizationId: params.organizationId,
    phleboId: params.phleboId,
    paymentMode: params.paymentMode,
    paymentStatus: params.paymentStatus,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toAppOrderListItemDto), total };
}

/** `scopeOrganizationId` is supplied only by the franchise portal, where an
 *  order belonging to another franchise must be indistinguishable from one that
 *  does not exist — hence 404 rather than 403, matching the same convention in
 *  `report.service.ts` and `bill.service.ts`. Admin callers pass nothing. */
export async function getAppOrderDetail(
  id: string,
  scopeOrganizationId?: string,
): Promise<AppOrderDetailDto> {
  const order = await appOrderRepository.findAppOrderById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }
  if (scopeOrganizationId && !(await isOrderVisibleToOrganization(order, scopeOrganizationId))) {
    throw ApiError.notFound("Order not found");
  }
  return toAppOrderDetailDto(order);
}

/** Generic admin-driven status change (Superadmin Order Management panel).
 *  Push side-effects run after the write has already committed — see
 *  `orderNotification.service.ts`'s doc-comment — and never block/fail this
 *  response. Cancelling through this path gets the same patient-facing copy
 *  as the app's own self-service cancel; every other status gets a generic
 *  "status is now X" notification. */
export async function updateAppOrderStatus(
  id: string,
  status: AppOrderDetailDto["status"],
  scopeOrganizationId?: string,
): Promise<AppOrderDetailDto> {
  // Fetched unconditionally (not just for the SAMPLE_COLLECTED check below)
  // once a franchise can call this too — it needs the order in hand to
  // confirm visibility before touching it at all.
  const current = await appOrderRepository.findAppOrderById(id);
  if (!current) {
    throw ApiError.notFound("Order not found");
  }
  if (scopeOrganizationId && !(await isOrderVisibleToOrganization(current, scopeOrganizationId))) {
    throw ApiError.notFound("Order not found");
  }
  // The sample is the patient's proof they paid COD — collecting it first
  // and chasing payment after routinely means never collecting at all, so
  // this is a hard gate, not just a reminder: the sample can't move to
  // SAMPLE_COLLECTED (from here or the phlebo app's own equivalent check in
  // `phlebo/booking.service.ts#updateBookingStatus`) while money is still
  // owed. Collecting COD (`collectCod`)/an online payment settling is what
  // clears it.
  if (status === "SAMPLE_COLLECTED" && current.paymentStatus !== "PAID") {
    throw ApiError.badRequest("Collect payment before marking the sample as collected");
  }

  const extra = status === "CANCELLED" ? { cancelledAt: new Date() } : {};
  const order = await withTranslatedErrors(() =>
    appOrderRepository.updateAppOrderStatus(id, status, extra),
  );
  await appOrderRepository.recordAppOrderStatusHistory(
    id,
    status,
    scopeOrganizationId ? "FRANCHISE" : "ADMIN",
  );

  if (status === "CANCELLED") {
    await notifyOrderCancelled(order.appUserId, order.id, order.orderNumber);
    // The assigned phlebo may already be on their way — tell them too, or
    // they'd only find out on arrival. Nothing to send when the booking
    // never had a phlebo on it.
    if (order.phlebotomist) {
      await notifyBookingCancelledToPhlebo(order.phlebotomist, order.id, order.orderNumber);
    }
  } else {
    await notifyOrderStatusChanged(order.appUserId, order.id, order.orderNumber, status);
  }

  return toAppOrderDetailDto(order);
}

export async function assignPhlebo(
  id: string,
  phleboId: string | null,
  scopeOrganizationId?: string,
): Promise<AppOrderDetailDto> {
  // Read before the write — both to know who (if anyone) is losing this
  // job, and, for a franchise caller, to confirm the order is even theirs
  // to touch.
  const previous = await appOrderRepository.findAppOrderById(id);
  if (!previous) {
    throw ApiError.notFound("Order not found");
  }
  if (scopeOrganizationId && !(await isOrderVisibleToOrganization(previous, scopeOrganizationId))) {
    throw ApiError.notFound("Order not found");
  }

  if (phleboId) {
    const phlebotomist = await phlebotomistRepository.findPhlebotomistById(phleboId);
    if (!phlebotomist || !phlebotomist.isActive) {
      throw ApiError.badRequest("Selected phlebotomist is not available");
    }
    // A franchise may only assign a phlebo it created itself — never an
    // admin-created one or another franchise's (see
    // `Phlebotomist.createdByOrganizationId`'s doc-comment).
    if (scopeOrganizationId && phlebotomist.createdByOrganizationId !== scopeOrganizationId) {
      throw ApiError.badRequest("Selected phlebotomist is not available");
    }
  }

  const order = await withTranslatedErrors(() =>
    appOrderRepository.updateAppOrderPhlebo(id, phleboId),
  );

  // Only on an actual assignment — unassigning (phleboId: null) has no one
  // new to notify.
  if (phleboId && order.phlebotomist) {
    await Promise.all([
      notifyPhleboAssignedToPatient(
        order.appUserId,
        order.id,
        order.orderNumber,
        order.phlebotomist.name,
      ),
      notifyNewAssignmentToPhlebo(order.phlebotomist, order.id, order.orderNumber),
    ]);
    // Re-saving the same phlebo is not a new assignment worth an SMS.
    if (previous?.phleboId !== phleboId) {
      void smsOnPhleboAssigned(order.id);
    }
  }

  // The previous assignee, if this replaced or cleared them — otherwise the
  // booking silently vanishes from their list. Re-assigning to the same
  // phlebo is not a removal.
  if (previous?.phlebotomist && previous.phleboId !== phleboId) {
    await notifyBookingUnassignedFromPhlebo(previous.phlebotomist, order.id, order.orderNumber);
  }

  return toAppOrderDetailDto(order);
}

export async function deleteAppOrder(id: string): Promise<void> {
  const order = await appOrderRepository.findAppOrderById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }
  if (order.appointments.length > 0) {
    throw ApiError.badRequest(
      "This order has linked appointments/bills — cancel it via status update instead of deleting.",
    );
  }
  await appOrderRepository.deleteAppOrder(id);
}

/** `Patient.dob` has no "age only" concept, so a bare age is converted to
 *  Jan 1 of the implied birth year — same convention (and same precision
 *  trade-off) as `app/familyMember.service.ts`'s own copy of this. */
function approximateDobFromAge(age: number): Date {
  const currentYear = new Date().getUTCFullYear();
  return new Date(Date.UTC(currentYear - age, 0, 1));
}

/** Resolves `createManualOrder`'s patient-side inputs to real ids — either
 *  by looking up an existing customer's own family member/address (and
 *  validating both actually belong to that `AppUser`), or, for a walk-in
 *  `newCustomer`, creating the `AppUser` + a `SELF` `FamilyMember`/`Patient`
 *  + one `Address` fresh, all inside one transaction so a failure here
 *  never leaves a half-created customer behind. `organizationId` (set only
 *  when a franchise is creating this order) is stamped onto the new
 *  `Patient` row too, so the franchise's own Reports tab — which scopes by
 *  `Patient.organizationId` — can find this customer's reports later. */
async function resolveOrderCustomer(
  input: CreateAppOrderInput,
): Promise<{ appUserId: string; familyMemberId: string; patientId: string; addressId: string }> {
  if (input.newCustomer) {
    const nc = input.newCustomer;
    if (!nc.dob && nc.age == null) {
      throw ApiError.badRequest("Either dob or age is required for a new customer");
    }
    const dob = nc.dob ? new Date(nc.dob) : approximateDobFromAge(nc.age!);

    return withTranslatedErrors(() =>
      prisma.$transaction(async (tx) => {
        const existing = await tx.appUser.findUnique({ where: { mobile: nc.mobile } });
        if (existing) {
          throw ApiError.conflict(
            "A customer with this mobile number already exists — search for them instead",
          );
        }

        const appUser = await tx.appUser.create({
          data: {
            mobile: nc.mobile,
            name: nc.name,
            gender: toDbGender(nc.gender),
            isActive: true,
          },
        });
        const patient = await createLinkedPatient(
          {
            fullName: nc.name,
            gender: nc.gender,
            dob: dob.toISOString().slice(0, 10),
            mobile: nc.mobile,
            email: nc.email,
          },
          tx,
        );
        if (input.organizationId) {
          await tx.patient.update({
            where: { id: patient.id },
            data: { organizationId: input.organizationId },
          });
        }
        const familyMember = await tx.familyMember.create({
          data: { appUserId: appUser.id, patientId: patient.id, relation: "SELF" },
        });
        const address = await tx.address.create({
          data: {
            appUserId: appUser.id,
            address: nc.address.address,
            city: nc.address.city,
            state: nc.address.state,
            pincode: nc.address.pincode,
            areaId: nc.address.areaId,
            phone: nc.address.phone || nc.mobile,
            isDefault: true,
          },
        });

        return {
          appUserId: appUser.id,
          familyMemberId: familyMember.id,
          patientId: patient.id,
          addressId: address.id,
        };
      }),
    );
  }

  if (!input.appUserId) {
    throw ApiError.badRequest("Either appUserId or newCustomer is required");
  }

  const appUser = await appOrderRepository.findAppUserById(input.appUserId);
  if (!appUser) {
    throw ApiError.notFound("Patient app user not found");
  }

  const familyMember = input.familyMemberId
    ? await appOrderRepository.findFamilyMemberById(input.familyMemberId)
    : await appOrderRepository.findSelfFamilyMember(input.appUserId);
  if (!familyMember || familyMember.appUserId !== input.appUserId) {
    throw ApiError.badRequest("Family member not found for this patient app user");
  }

  if (!input.addressId) {
    throw ApiError.badRequest("addressId is required");
  }
  const address = await appOrderRepository.findAddressById(input.addressId);
  if (!address || address.appUserId !== input.appUserId) {
    throw ApiError.badRequest("Address not found for this patient app user");
  }

  return {
    appUserId: input.appUserId,
    familyMemberId: familyMember.id,
    patientId: familyMember.patientId,
    addressId: address.id,
  };
}

/** Admin "manual create" — mirrors `app/order.service.ts#confirmOrder`'s
 *  transaction shape (real Appointment + Bill + AppOrder + AppOrderAppointment,
 *  slot capacity decrement, generated service PIN), simplified for this round:
 *  no cart, no coupon, no wallet — billing is computed at 0% discount / 0
 *  amount paid via the same `resolveTestsAndComputeBilling` the rest of the
 *  admin app uses. Also the franchise portal's own "Create Order" action —
 *  `input.organizationId` is what tells the two apart (see
 *  `resolveOrderCustomer` and `franchiseOrderScope.ts`). */
export async function createManualOrder(input: CreateAppOrderInput): Promise<AppOrderDetailDto> {
  const { appUserId, familyMemberId, patientId, addressId } = await resolveOrderCustomer(input);

  if (input.slotId) {
    const slot = await appOrderRepository.findSlotById(input.slotId);
    if (!slot) {
      throw ApiError.notFound("Slot not found");
    }
  }

  const packageTestIds = (
    await Promise.all(
      (input.packageIds ?? []).map((packageId) => expandToTestIds("PACKAGE", packageId)),
    )
  ).flat();
  const mergedTestIds = [...new Set([...input.testIds, ...packageTestIds])];

  const billing = await resolveTestsAndComputeBilling(mergedTestIds, 0, 0);

  // Selected-items snapshot (Test/Package as picked, not the package's
  // expanded constituent tests) — mirrors `app/order.service.ts#confirmOrder`
  // so Order Detail shows the same "what was booked" view for both flows.
  const [selectedTests, selectedPackages] = await Promise.all([
    input.testIds.length
      ? prisma.test.findMany({ where: { id: { in: input.testIds } } })
      : Promise.resolve([]),
    input.packageIds?.length
      ? prisma.package.findMany({ where: { id: { in: input.packageIds } } })
      : Promise.resolve([]),
  ]);
  const selectedItems = [
    ...selectedTests.map((t) => ({
      itemType: "TEST" as const,
      itemId: t.id,
      name: t.name,
      price: Number(t.price),
    })),
    ...selectedPackages.map((p) => ({
      itemType: "PACKAGE" as const,
      itemId: p.id,
      name: p.name,
      price: Number(p.offerPrice ?? p.price),
    })),
  ];

  const paymentModeLabel = input.paymentMode === "CASH" ? "Cash" : "Online";
  const servicePin = String(Math.floor(1000 + Math.random() * 9000));
  const orderDate = new Date(input.orderDate);

  const createdOrderId = await prisma.$transaction(async (tx) => {
    if (input.slotId) {
      const freshSlot = await appOrderRepository.findSlotByIdTx(input.slotId, tx);
      if (!freshSlot || freshSlot.isBlocked || freshSlot.bookedCount >= freshSlot.capacity) {
        throw ApiError.conflict("This slot is no longer available");
      }
      await appOrderRepository.incrementSlotBooked(input.slotId, tx);
    }

    const appointmentNo = await nextAppointmentNo(tx);
    const appointment = await appointmentRepository.createAppointment(
      {
        appointmentNo,
        patientId,
        subtotal: billing.subtotal,
        discountPercent: billing.discountPercent,
        discountAmount: billing.discountAmount,
        netAmount: billing.netAmount,
        paymentMode: paymentModeLabel,
        amountPaid: billing.amountPaid,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
        tests: billing.tests,
      },
      tx,
    );

    await billRepository.createBillForAppointment(
      {
        appointmentId: appointment.id,
        patientId,
        netAmount: billing.netAmount,
        amountPaid: billing.amountPaid,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
        paymentMode: paymentModeLabel,
      },
      tx,
    );

    const orderNumber = await nextAppOrderNumber(tx);
    const order = await appOrderRepository.createAppOrderRow(
      {
        orderNumber,
        appUserId,
        addressId,
        slotId: input.slotId ?? null,
        orderDate,
        subtotal: billing.subtotal,
        totalPayable: billing.netAmount,
        paymentMode: input.paymentMode,
        paymentStatus: billing.paymentStatus,
        servicePin,
        organizationId: input.organizationId,
      },
      tx,
    );

    await appOrderRepository.createAppOrderAppointmentRow(
      { orderId: order.id, appointmentId: appointment.id, familyMemberId },
      tx,
    );

    await tx.appOrderItem.createMany({
      data: selectedItems.map((item) => ({
        ...item,
        orderId: order.id,
        familyMemberId,
      })),
    });

    return order.id;
  });

  void smsOnOrderConfirmed(createdOrderId);

  return getAppOrderDetail(createdOrderId);
}

/** A HOME_VISIT order is booked with a symptom, not a test list — its
 *  Appointment/Bill/AppOrderItem rows fill in (created on the first call)
 *  once the phlebo has actually examined the patient and knows what to test
 *  for. `addHomeVisitItems`/`removeHomeVisitItem` are both callable
 *  repeatedly and from either side — the phlebo, as they discover more is
 *  (or isn't) needed, or an admin from Order Management. Shared by both
 *  callers and both directions; `scopePhleboId` is set only by the
 *  phlebo-app path, so a phlebo can only touch a booking actually assigned
 *  to them — admin passes nothing. Same billing convention as
 *  `createManualOrder` above: full test MRP, 0% discount, 0 paid up front
 *  (settled COD at the doorstep via the existing cod-collect action). */
const HOME_VISIT_ITEM_ADDABLE_STATUSES: ReadonlyArray<AppOrderStatus> = [
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
];

/** Loads a HOME_VISIT order and runs every check shared by add/remove —
 *  exists, ownership, right order type, has a patient, and is in a status
 *  where its test list is still editable. */
async function loadEditableHomeVisitOrder(
  orderId: string,
  scopePhleboId?: string,
  scopeOrganizationId?: string,
) {
  const order = await appOrderRepository.findAppOrderById(orderId);
  if (!order || (scopePhleboId && order.phleboId !== scopePhleboId)) {
    throw ApiError.notFound("Booking not found");
  }
  if (scopeOrganizationId && !(await isOrderVisibleToOrganization(order, scopeOrganizationId))) {
    throw ApiError.notFound("Booking not found");
  }
  if (order.orderType !== "HOME_VISIT") {
    throw ApiError.badRequest("This order already has its tests fixed at booking");
  }
  if (!order.homeVisitFamilyMemberId) {
    throw ApiError.badRequest("This booking has no patient to test against");
  }
  if (!HOME_VISIT_ITEM_ADDABLE_STATUSES.includes(order.status)) {
    throw ApiError.conflict(
      "Tests can only be added or removed once the visit is under way (accepted, on the way, or reached)",
    );
  }
  return order;
}

/** Single source of truth for a home-visit order's billing, run at the end
 *  of both `addHomeVisitItems` and `removeHomeVisitItem` — recomputes
 *  everything from whatever `AppOrderItem` rows exist right now, rather than
 *  incrementally adding/subtracting. That's what makes remove a safe,
 *  symmetric mirror of add instead of its own separate math to get wrong:
 *  a test billed once but reachable through two different current items (a
 *  standalone `TEST` item AND a `PACKAGE` item that also contains it) stays
 *  billed exactly once for as long as EITHER one is still on the order, and
 *  drops out the moment NEITHER is — which incremental subtraction on
 *  remove could not tell apart from "remove it, full stop" without
 *  re-deriving this same set anyway.
 *
 *  Creates the Appointment/Bill on the very first call (when nothing has
 *  been added yet), same as the old add-only version did; after that it
 *  only ever updates them. Never deletes the Appointment/Bill rows even if
 *  every item is removed — they zero out instead, so a subsequent add
 *  has somewhere to attach to without re-minting an appointment number. */
async function recomputeHomeVisitBilling(
  orderId: string,
  familyMemberId: string,
  patientId: string,
  paymentModeLabel: "Cash" | "Online",
  phlebotomyCharges: number,
  existingAppointment: { id: string } | null,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const items = await tx.appOrderItem.findMany({ where: { orderId } });
  const testItemIds = items.filter((i) => i.itemType === "TEST").map((i) => i.itemId);
  const packageItemIds = items.filter((i) => i.itemType === "PACKAGE").map((i) => i.itemId);
  const packageTestIds = (
    await Promise.all(packageItemIds.map((id) => expandToTestIds("PACKAGE", id)))
  ).flat();
  const requiredTestIds = [...new Set([...testItemIds, ...packageTestIds])];

  const billing =
    requiredTestIds.length > 0
      ? await resolveTestsAndComputeBilling(requiredTestIds, 0, 0)
      : {
          subtotal: 0,
          discountPercent: 0,
          discountAmount: 0,
          netAmount: 0,
          amountPaid: 0,
          dueAmount: 0,
          paymentStatus: "PENDING" as const,
          tests: [],
        };

  let appointmentId = existingAppointment?.id ?? null;
  if (!appointmentId) {
    const appointmentNo = await nextAppointmentNo(tx);
    const appointment = await appointmentRepository.createAppointment(
      {
        appointmentNo,
        patientId,
        subtotal: billing.subtotal,
        discountPercent: billing.discountPercent,
        discountAmount: billing.discountAmount,
        netAmount: billing.netAmount,
        paymentMode: paymentModeLabel,
        amountPaid: billing.amountPaid,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
        tests: billing.tests,
        homeCollection: true,
      },
      tx,
    );
    await billRepository.createBillForAppointment(
      {
        appointmentId: appointment.id,
        patientId,
        netAmount: billing.netAmount,
        amountPaid: billing.amountPaid,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
        paymentMode: paymentModeLabel,
      },
      tx,
    );
    await appOrderRepository.createAppOrderAppointmentRow(
      { orderId, appointmentId: appointment.id, familyMemberId },
      tx,
    );
    appointmentId = appointment.id;
  } else {
    const existingAppointmentId = appointmentId;
    // Reconcile AppointmentTest to exactly `requiredTestIds`: drop whatever
    // no longer belongs (a removed test/package, and nothing else still
    // needs it), add whatever's newly required. `skipDuplicates` guards the
    // insert against a concurrent call already having added the same row.
    await tx.appointmentTest.deleteMany({
      where: { appointmentId: existingAppointmentId, testId: { notIn: requiredTestIds } },
    });
    if (billing.tests.length > 0) {
      await tx.appointmentTest.createMany({
        data: billing.tests.map((t) => ({ ...t, appointmentId: existingAppointmentId })),
        skipDuplicates: true,
      });
    }

    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        subtotal: billing.subtotal,
        netAmount: billing.netAmount,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
      },
    });
    await tx.bill.update({
      where: { appointmentId },
      data: {
        netAmount: billing.netAmount,
        dueAmount: billing.dueAmount,
        paymentStatus: billing.paymentStatus,
      },
    });
  }

  await tx.appOrder.update({
    where: { id: orderId },
    data: {
      subtotal: billing.subtotal,
      totalPayable: billing.netAmount + phlebotomyCharges,
      paymentStatus: billing.paymentStatus,
    },
  });
}

export async function addHomeVisitItems(
  orderId: string,
  input: AddHomeVisitItemsInput,
  scopePhleboId?: string,
  scopeOrganizationId?: string,
): Promise<AppOrderDetailDto> {
  const order = await loadEditableHomeVisitOrder(orderId, scopePhleboId, scopeOrganizationId);
  if (input.testIds.length === 0 && !input.packageIds?.length) {
    throw ApiError.badRequest("Select at least one test or package");
  }

  const existingItemKeys = new Set(order.items.map((i) => `${i.itemType}:${i.itemId}`));
  const newTestIds = input.testIds.filter((id) => !existingItemKeys.has(`TEST:${id}`));
  const newPackageIds = (input.packageIds ?? []).filter(
    (id) => !existingItemKeys.has(`PACKAGE:${id}`),
  );
  if (newTestIds.length === 0 && newPackageIds.length === 0) {
    throw ApiError.conflict("These tests/packages have already been added to this booking");
  }

  const [selectedTests, selectedPackages] = await Promise.all([
    newTestIds.length ? prisma.test.findMany({ where: { id: { in: newTestIds } } }) : [],
    newPackageIds.length ? prisma.package.findMany({ where: { id: { in: newPackageIds } } }) : [],
  ]);
  if (selectedTests.length !== newTestIds.length) {
    throw ApiError.badRequest("One or more selected tests do not exist");
  }
  if (selectedPackages.length !== newPackageIds.length) {
    throw ApiError.badRequest("One or more selected packages do not exist");
  }

  const newItems = [
    ...selectedTests.map((t) => ({
      itemType: "TEST" as const,
      itemId: t.id,
      name: t.name,
      price: Number(t.price),
    })),
    ...selectedPackages.map((p) => ({
      itemType: "PACKAGE" as const,
      itemId: p.id,
      name: p.name,
      price: Number(p.offerPrice ?? p.price),
    })),
  ];

  const familyMemberId = order.homeVisitFamilyMemberId!;
  const paymentModeLabel = order.paymentMode === "ONLINE" ? "Online" : "Cash";
  const existingAppointment = order.appointments[0]?.appointment ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.appOrderItem.createMany({
      data: newItems.map((item) => ({ ...item, orderId, familyMemberId })),
    });
    await recomputeHomeVisitBilling(
      orderId,
      familyMemberId,
      order.homeVisitFamilyMember!.patientId,
      paymentModeLabel,
      Number(order.phlebotomyCharges),
      existingAppointment,
      tx,
    );
  });

  return getAppOrderDetail(orderId);
}

/** The mirror of `addHomeVisitItems` — removes one line (a test or a
 *  package) the phlebo/admin added, then re-derives every total from
 *  scratch via `recomputeHomeVisitBilling` (see its own doc-comment for why
 *  that, rather than subtracting this item's price, is what keeps an
 *  overlapping test/package combination billed correctly). `itemId` is
 *  meant to be the `AppOrderItem.id` shown on the order/booking detail
 *  response (not a test or package id, since either type can be removed
 *  through the same endpoint and only the item id is unambiguous) — but
 *  also matches on the underlying test/package's own catalog id
 *  (`AppOrderItem.itemId`) as a fallback, since the phlebo app's booking
 *  detail screen shows that id more prominently (it's the one every test/
 *  package already had, long before `item_id` was added alongside it) and
 *  a client built against the older shape will naturally send that one
 *  instead. Both are globally-unique UUIDs from independent tables, so
 *  there's no realistic ambiguity in accepting either. */
export async function removeHomeVisitItem(
  orderId: string,
  itemId: string,
  scopePhleboId?: string,
  scopeOrganizationId?: string,
): Promise<AppOrderDetailDto> {
  const order = await loadEditableHomeVisitOrder(orderId, scopePhleboId, scopeOrganizationId);

  const item = order.items.find((i) => i.id === itemId || i.itemId === itemId);
  if (!item) {
    throw ApiError.notFound("This test/package is not on this booking");
  }

  const familyMemberId = order.homeVisitFamilyMemberId!;
  const paymentModeLabel = order.paymentMode === "ONLINE" ? "Online" : "Cash";
  const existingAppointment = order.appointments[0]?.appointment ?? null;

  await prisma.$transaction(async (tx) => {
    // Always the resolved row's own id — `itemId` (the caller's input) may
    // have matched via the `item.itemId` fallback above instead.
    await tx.appOrderItem.delete({ where: { id: item.id } });
    await recomputeHomeVisitBilling(
      orderId,
      familyMemberId,
      order.homeVisitFamilyMember!.patientId,
      paymentModeLabel,
      Number(order.phlebotomyCharges),
      existingAppointment,
      tx,
    );
  });

  return getAppOrderDetail(orderId);
}
