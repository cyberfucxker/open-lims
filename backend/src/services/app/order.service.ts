import { randomUUID } from "crypto";
import { Prisma, type AppPlatform } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { computeAge } from "../../repositories/patient.repository";
import { fromDbGender, fromDbPaymentMode, toRelationLabel } from "../../utils/enumMappers";
import { nextAppointmentNo, nextAppOrderNumber } from "../../utils/idGenerator";
import * as appointmentRepository from "../../repositories/appointment.repository";
import * as billRepository from "../../repositories/bill.repository";
import { resolveTestsAndComputeBilling } from "../appointment.service";
import { resolveCartItems } from "./cart.service";
import { checkCouponEligibility } from "./coupon.util";
import { expandToTestIds, groupByFamilyMember } from "./order.util";
import { formatDDMMYYYY } from "../../utils/app/date.util";
import {
  checkSlotAvailability,
  lockSlotForBooking,
  resolveAddressSlotContext,
  resolvePhlebotomyCharge,
} from "../slotAvailability.service";
import type { AppOrderStatus } from "@prisma/client";
import {
  notifyBookingCancelledToPhlebo,
  notifyBookingRescheduledToPhlebo,
  notifyOrderCancelled,
  notifyOrderConfirmed,
  notifyOrderRescheduled,
} from "../orderNotification.service";
import { notifyFranchisesOfNewBooking } from "../organizationNotification.service";
import { smsOnFranchiseHandover, smsOnOrderConfirmed } from "../orderSms.service";
import { resolveOwningOrganizationIds as owningFranchiseIdsFor } from "../franchiseOrderScope";

const ORDER_STATUS_LABEL: Record<AppOrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  ACCEPTED: "Phlebotomist Assigned",
  STARTED_JOURNEY: "Phlebotomist On The Way",
  REACHED: "Reached",
  SAMPLE_COLLECTED: "Sample Collected",
  SAMPLE_DROPPED: "Sample Dropped At Lab",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const PIN_HIDDEN_STATUSES: ReadonlySet<AppOrderStatus> = new Set([
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
  "COMPLETED",
  "CANCELLED",
]);

function visibleServicePin(order: { status: AppOrderStatus; servicePin: string | null }) {
  return PIN_HIDDEN_STATUSES.has(order.status) ? null : order.servicePin;
}

async function loadCheckoutCart(appUserId: string) {
  const cart = await prisma.cart.findUnique({
    where: { appUserId },
    include: { items: true, coupon: true },
  });

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }
  if (cart.items.some((item) => !item.familyMemberId)) {
    throw ApiError.badRequest("Complete your profile before checkout");
  }

  return cart;
}

/** What checkout prices and books from. The app passes the user's real
 *  `Cart` (`id` set — emptied once the booking lands); a direct booking (the
 *  WhatsApp assistant) passes its own lines with `id: null`, so the user's
 *  app cart is never read, written or cleared. */
export interface CheckoutCart {
  id: string | null;
  couponId: string | null;
  coupon: Awaited<ReturnType<typeof loadCheckoutCart>>["coupon"];
  items: Array<{
    id: string;
    itemType: "TEST" | "PACKAGE";
    itemId: string;
    familyMemberId: string | null;
  }>;
}

interface PricingOptions {
  /** False skips the wallet entirely — no balance read, nothing debited —
   *  even when the user has an app wallet balance. */
  applyWallet: boolean;
}

async function computePricingPreview(
  cart: CheckoutCart,
  appUserId: string,
  platform: AppPlatform,
  options: PricingOptions = { applyWallet: true },
) {
  const resolved = await resolveCartItems(cart.items);
  const subtotal = resolved.reduce((sum, item) => sum + item.salePrice, 0);

  let couponDiscount = 0;
  if (cart.coupon) {
    const eligibility = await checkCouponEligibility(cart.coupon, subtotal, appUserId, platform);
    if (eligibility.valid) couponDiscount = eligibility.discountAmount;
  }

  if (!options.applyWallet) {
    return {
      resolved,
      subtotal,
      couponDiscount,
      walletAvailable: 0,
      walletApplicable: 0,
      wallet: null,
    };
  }

  const wallet = await prisma.wallet.upsert({
    where: { appUserId },
    update: {},
    create: { appUserId },
  });
  const walletAvailable = Number(wallet.balance);
  const walletApplicable = Math.max(Math.min(walletAvailable, subtotal - couponDiscount), 0);

  return { resolved, subtotal, couponDiscount, walletAvailable, walletApplicable, wallet };
}

export interface CheckoutSlot {
  slotId: string | null;
  slotTemplateId: string | null;
  areaId: string | null;
  slotTitle: string;
  phlebotomyCharges: number;
}

/** Validates `slotId` for this address+date and prices the visit — Review
 *  Cart's slot step, shared with direct bookings so both pick, block and
 *  charge slots identically. */
export async function resolveCheckoutSlot(
  address: { id: string; areaId: string | null; pincode: string },
  slotIdInput: string,
  date: string,
): Promise<CheckoutSlot> {
  const context = await resolveAddressSlotContext(address);

  // `slotId`/`slotTemplateId`/`areaId` are mutually exclusive on AppOrder —
  // exactly one pair is set depending on whether this address's city has
  // been cut over to the new Slot Template engine (see
  // `slotAvailability.service.ts`). `slotIdInput` is opaque to the
  // client either way (it's whatever id Slot Availability just gave it).
  if (context.useNewSlotSystem && context.cityId) {
    const template = await prisma.slotTemplate.findUnique({ where: { id: slotIdInput } });
    if (!template) {
      throw ApiError.notFound("Slot not found");
    }
    const availability = await checkSlotAvailability({
      cityId: context.cityId,
      areaId: context.areaId,
      slotTemplateId: template.id,
      date,
    });
    if (availability.isBlocked) {
      throw ApiError.conflict(availability.blockReason ?? "This slot is no longer available");
    }
    return {
      slotId: null,
      slotTemplateId: template.id,
      areaId: context.areaId,
      slotTitle: `${template.startTime} - ${template.endTime}`,
      // The new Slot Template system has no per-slot surcharge concept —
      // instead it's a city/area-wise charge set by admins (see
      // City.phlebotomyCharge/Area.phlebotomyCharge, Superadmin's CMS
      // "Phlebotomy Charges" tab). Legacy `Slot.surchargeAmount` stays
      // legacy-only, untouched below.
      phlebotomyCharges: await resolvePhlebotomyCharge(context.cityId, context.areaId),
    };
  }

  const slot = await prisma.slot.findUnique({ where: { id: slotIdInput } });
  if (!slot) {
    throw ApiError.notFound("Slot not found");
  }
  if (slot.isBlocked || slot.bookedCount >= slot.capacity) {
    throw ApiError.conflict("This slot is no longer available");
  }
  return {
    slotId: slot.id,
    slotTemplateId: null,
    areaId: null,
    slotTitle: `${slot.startTime} - ${slot.endTime}`,
    phlebotomyCharges: Number(slot.surchargeAmount),
  };
}

export interface ReviewCartResult {
  order_id: string;
  order_number: string;
  order_status: string;
  family_members: Array<{
    member_id: string;
    name: string;
    relation: string;
    gender: string;
    age: number;
    dob: string;
    items: Array<{ name: string; price: number }>;
  }>;
  cart_items: Array<{
    cart_id: string;
    family_member_id: string;
    family_member_name: string;
    type: number;
    type_label: string;
    type_id: string;
    name: string;
    mrp: number;
    price: number;
  }>;
  sample_collection: {
    date: string;
    slot_id: string;
    slot: string;
    address: Record<string, unknown>;
  };
  coupon: {
    applied: boolean;
    coupon_id: string;
    coupon_code: string;
    coupon_discount: number;
  } | null;
  payment_summary: {
    subtotal: number;
    phlebotomy_charges: number;
    wallet_discount: number;
    coupon_discount: number;
    total_payable: number;
  };
}

export async function reviewCart(
  appUserId: string,
  input: { address_id: string; slot_id: string; date: string },
  platform: AppPlatform,
): Promise<ReviewCartResult> {
  const address = await prisma.address.findUnique({ where: { id: input.address_id } });
  if (!address || address.appUserId !== appUserId) {
    throw ApiError.notFound("Address not found");
  }

  const { slotId, slotTemplateId, areaId, slotTitle, phlebotomyCharges } =
    await resolveCheckoutSlot(address, input.slot_id, input.date);

  const cart = await loadCheckoutCart(appUserId);
  const { resolved, subtotal, couponDiscount, walletApplicable } = await computePricingPreview(
    cart,
    appUserId,
    platform,
  );

  const resolvedById = new Map(resolved.map((r) => [r.id, r]));
  const lineItems = cart.items.filter((item) => resolvedById.has(item.id));

  const familyMemberIds = [...new Set(lineItems.map((i) => i.familyMemberId as string))];
  const familyMembers = await prisma.familyMember.findMany({
    where: { id: { in: familyMemberIds } },
    include: { patient: true },
  });
  const familyMemberById = new Map(familyMembers.map((fm) => [fm.id, fm]));

  const groups = groupByFamilyMember(
    lineItems.map((i) => ({
      id: i.id,
      itemType: i.itemType,
      itemId: i.itemId,
      familyMemberId: i.familyMemberId,
    })),
  );

  const totalPayable = Math.max(
    subtotal + phlebotomyCharges - couponDiscount - walletApplicable,
    0,
  );

  // One draft AppOrder per user — re-calling Review Cart updates the same
  // draft rather than piling up abandoned rows.
  const existingDraft = await prisma.appOrder.findFirst({ where: { appUserId, isDraft: true } });

  const draftFields = {
    addressId: address.id,
    slotId,
    slotTemplateId,
    areaId,
    orderDate: new Date(input.date),
    subtotal,
    phlebotomyCharges,
    couponId: cart.couponId,
    couponDiscount,
    walletDiscount: walletApplicable,
    totalPayable,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };

  const order = existingDraft
    ? await prisma.appOrder.update({ where: { id: existingDraft.id }, data: draftFields })
    : await prisma.appOrder.create({
        data: { ...draftFields, appUserId, orderNumber: await nextAppOrderNumber() },
      });

  return {
    order_id: order.id,
    order_number: order.orderNumber,
    order_status: ORDER_STATUS_LABEL[order.status],
    family_members: groups.map((group) => {
      const fm = familyMemberById.get(group.familyMemberId)!;
      return {
        member_id: fm.id,
        name: `${fm.patient.firstName} ${fm.patient.lastName}`.trim(),
        relation: toRelationLabel(fm.relation),
        gender: fromDbGender(fm.patient.gender),
        age: computeAge(fm.patient.dob),
        dob: formatDDMMYYYY(fm.patient.dob),
        items: group.lines.map((line) => {
          const r = resolvedById.get(line.id)!;
          return { name: r.testName, price: r.salePrice };
        }),
      };
    }),
    cart_items: lineItems.map((item) => {
      const r = resolvedById.get(item.id)!;
      const fm = familyMemberById.get(item.familyMemberId as string)!;
      return {
        cart_id: item.id,
        family_member_id: fm.id,
        family_member_name: `${fm.patient.firstName} ${fm.patient.lastName}`.trim(),
        type: item.itemType === "TEST" ? 1 : 2,
        type_label: item.itemType === "TEST" ? "Test" : "Package",
        type_id: item.itemId,
        name: r.testName,
        mrp: r.mrp,
        price: r.salePrice,
      };
    }),
    sample_collection: {
      date: input.date,
      slot_id: (slotTemplateId ?? slotId) as string,
      slot: slotTitle,
      address: {
        address_id: address.id,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
    },
    coupon: cart.coupon
      ? {
          applied: couponDiscount > 0,
          coupon_id: cart.coupon.id,
          coupon_code: cart.coupon.code,
          coupon_discount: couponDiscount,
        }
      : null,
    payment_summary: {
      subtotal,
      phlebotomy_charges: phlebotomyCharges,
      wallet_discount: walletApplicable,
      coupon_discount: couponDiscount,
      total_payable: totalPayable,
    },
  };
}

export interface ConfirmOrderResult {
  order_number: string;
  order_status: string;
  service_pin: string;
  total_payable: number;
}

interface FinalizeBookingResult {
  servicePin: string;
  totalPayable: number;
}

/** The fields of an AppOrder that finalize reads — a persisted draft from
 *  Review Cart, or a direct booking's not-yet-inserted order. */
type FinalizeOrder = Pick<
  Prisma.AppOrderGetPayload<object>,
  | "id"
  | "orderNumber"
  | "slotId"
  | "slotTemplateId"
  | "areaId"
  | "addressId"
  | "orderDate"
  | "phlebotomyCharges"
  | "organizationId"
  | "serviceCenterId"
>;

interface FinalizeOptions {
  /** Defaults to the user's own app `Cart`. */
  cart?: CheckoutCart;
  /** Defaults to true (the app's behaviour). */
  applyWallet?: boolean;
  /** Set for a direct booking: the AppOrder row is inserted inside the
   *  booking transaction, so it never exists as a visible draft that Review
   *  Cart's "one draft per user" lookup could pick up and overwrite. */
  createOrder?: Omit<Prisma.AppOrderUncheckedCreateInput, "id" | "orderNumber">;
  /** Runs inside the booking transaction, after the order is confirmed —
   *  a throw rolls the whole booking back. */
  onConfirmedInTx?: (tx: Prisma.TransactionClient, orderId: string) => Promise<void>;
}

/** Turns a draft AppOrder into a real booking: creates the Appointments/Bills,
 *  locks the slot, debits the wallet, redeems the coupon, and flips the order
 *  to CONFIRMED. Shared by two very differently-timed callers:
 *
 *  - `confirmOrder` (cash) — called eagerly, the moment the user picks Cash on
 *    Delivery, before any money has changed hands (COD is settled later at the
 *    doorstep).
 *  - `finalizeOnlinePaymentBooking` — called only AFTER Razorpay has verified
 *    payment succeeded, so an online booking never exists as a real
 *    Appointment until it's actually paid for. This is why online payments no
 *    longer confirm-then-pay: nothing is created up front to leave in a false
 *    "booked" state if the payment fails or is abandoned.
 *
 *  `order` must still be `isDraft` — callers check that (and existence/
 *  ownership) themselves so each can give its own error message. The final
 *  write is an `updateMany` gated on `isDraft: true` rather than a plain
 *  `update`, so if two finalize attempts ever race for the same order
 *  (a Razorpay webhook and this endpoint's own verify call, both reacting to
 *  the same successful payment), the loser's transaction throws and rolls
 *  back cleanly instead of double-creating Appointments. */
async function finalizeBookingForOrder(
  appUserId: string,
  order: FinalizeOrder,
  paymentType: "cash" | "online",
  platform: AppPlatform | null,
  options: FinalizeOptions = {},
): Promise<FinalizeBookingResult> {
  if ((!order.slotId && !order.slotTemplateId) || !order.addressId) {
    throw ApiError.badRequest("Call Review Cart before confirming the order");
  }

  const cart: CheckoutCart = options.cart ?? (await loadCheckoutCart(appUserId));
  const { resolved, subtotal, couponDiscount, walletApplicable, wallet } =
    await computePricingPreview(cart, appUserId, platform ?? "WEB", {
      applyWallet: options.applyWallet ?? true,
    });
  const resolvedById = new Map(resolved.map((r) => [r.id, r]));
  const lineItems = cart.items.filter((item) => resolvedById.has(item.id));
  const groups = groupByFamilyMember(
    lineItems.map((i) => ({
      id: i.id,
      itemType: i.itemType,
      itemId: i.itemId,
      familyMemberId: i.familyMemberId,
    })),
  );
  if (groups.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }

  const totalPayable = Math.max(
    subtotal + Number(order.phlebotomyCharges) - couponDiscount - walletApplicable,
    0,
  );
  const familyMembers = await prisma.familyMember.findMany({
    where: { id: { in: groups.map((g) => g.familyMemberId) } },
  });
  const familyMemberById = new Map(familyMembers.map((fm) => [fm.id, fm]));

  // Precompute each group's billing (reads only) before opening the write
  // transaction — mirrors registerPatient's own
  // resolveTestsAndComputeBilling-before-transaction pattern.
  const paymentModeLabel = paymentType === "cash" ? "Cash" : "Online";
  let allocatedCoupon = 0;
  let allocatedWallet = 0;

  const groupBillings = await Promise.all(
    groups.map(async (group, index) => {
      const isLast = index === groups.length - 1;
      const expandedTestIds = [
        ...new Set(
          (
            await Promise.all(
              group.lines.map((line) => expandToTestIds(line.itemType, line.itemId)),
            )
          ).flat(),
        ),
      ];

      const tests = await prisma.test.findMany({ where: { id: { in: expandedTestIds } } });
      const computedMrpSum = tests.reduce((sum, t) => sum + Number(t.price), 0);
      const groupOfferSum = group.lines.reduce(
        (sum, line) => sum + (resolvedById.get(line.id)?.salePrice ?? 0),
        0,
      );
      const shareRatio = subtotal > 0 ? groupOfferSum / subtotal : 0;

      const couponShare = isLast
        ? couponDiscount - allocatedCoupon
        : Math.round(couponDiscount * shareRatio * 100) / 100;
      const walletShare = isLast
        ? walletApplicable - allocatedWallet
        : Math.round(walletApplicable * shareRatio * 100) / 100;
      allocatedCoupon += couponShare;
      allocatedWallet += walletShare;

      const groupTargetNet = Math.max(groupOfferSum - couponShare - walletShare, 0);
      const groupDiscountAmount = Math.max(computedMrpSum - groupTargetNet, 0);
      const discountPercent = computedMrpSum > 0 ? (groupDiscountAmount / computedMrpSum) * 100 : 0;

      const billing = await resolveTestsAndComputeBilling(
        expandedTestIds,
        discountPercent,
        walletShare,
      );
      const familyMember = familyMemberById.get(group.familyMemberId);
      if (!familyMember) {
        throw ApiError.notFound("Family member not found");
      }

      return { familyMember, billing };
    }),
  );

  const servicePin = String(Math.floor(1000 + Math.random() * 9000));

  await prisma.$transaction(async (tx) => {
    if (options.createOrder) {
      await tx.appOrder.create({
        data: { ...options.createOrder, id: order.id, orderNumber: order.orderNumber },
      });
    }

    if (order.slotTemplateId && order.areaId) {
      const dateStr = order.orderDate.toISOString().slice(0, 10);
      // Serializes concurrent Confirm Order attempts for this exact
      // area+slot+date — "booked count" here is a live COUNT() over
      // AppOrder rows, not a single mutable counter Postgres would
      // otherwise serialize for us (unlike the legacy `Slot.bookedCount`
      // increment below).
      await lockSlotForBooking(tx, {
        areaId: order.areaId,
        slotTemplateId: order.slotTemplateId,
        date: dateStr,
      });

      const area = await tx.area.findUnique({
        where: { id: order.areaId },
        select: { cityId: true },
      });
      const availability = area
        ? await checkSlotAvailability(
            {
              cityId: area.cityId,
              areaId: order.areaId,
              slotTemplateId: order.slotTemplateId,
              date: dateStr,
            },
            tx,
          )
        : { isBlocked: true, blockReason: "This slot is no longer available" };

      if (availability.isBlocked) {
        throw ApiError.conflict(availability.blockReason ?? "This slot is no longer available");
      }
      // No explicit "increment" step needed — this order (already created
      // as a draft at Review Cart time) is counted the moment its status
      // moves past PENDING/isDraft below, since booked count is derived
      // live from AppOrder rows rather than a stored counter.
    } else if (order.slotId) {
      const freshSlot = await tx.slot.findUnique({ where: { id: order.slotId } });
      if (!freshSlot || freshSlot.isBlocked || freshSlot.bookedCount >= freshSlot.capacity) {
        throw ApiError.conflict("This slot is no longer available");
      }
      await tx.slot.update({
        where: { id: freshSlot.id },
        data: { bookedCount: { increment: 1 } },
      });
    }

    for (let i = 0; i < groupBillings.length; i++) {
      const { familyMember, billing } = groupBillings[i];
      const group = groups[i];
      const appointmentNo = await nextAppointmentNo(tx);
      const appointment = await appointmentRepository.createAppointment(
        {
          appointmentNo,
          patientId: familyMember.patientId,
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
          patientId: familyMember.patientId,
          netAmount: billing.netAmount,
          amountPaid: billing.amountPaid,
          dueAmount: billing.dueAmount,
          paymentStatus: billing.paymentStatus,
          paymentMode: "Wallet",
        },
        tx,
      );

      await tx.appOrderAppointment.create({
        data: { orderId: order.id, appointmentId: appointment.id, familyMemberId: familyMember.id },
      });

      await tx.appOrderItem.createMany({
        data: group.lines.map((line) => {
          const resolved = resolvedById.get(line.id)!;
          return {
            orderId: order.id,
            familyMemberId: familyMember.id,
            itemType: line.itemType,
            itemId: line.itemId,
            name: resolved.testName,
            price: resolved.salePrice,
          };
        }),
      });
    }

    if (wallet && allocatedWallet > 0) {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: allocatedWallet } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: allocatedWallet,
          source: "ORDER_PAYMENT",
          referenceId: order.id,
          balanceAfter: updatedWallet.balance,
        },
      });
    }

    if (cart.couponId && allocatedCoupon > 0) {
      await tx.couponRedemption.create({
        data: {
          couponId: cart.couponId,
          appUserId,
          orderId: order.id,
          discountAmount: allocatedCoupon,
        },
      });
    }

    // Gated on `isDraft: true` rather than a plain `update` — the atomic
    // "claim" that protects against the race described in this function's
    // doc-comment. A concurrent finalize that already flipped this order
    // (and thus already created its own Appointments in this same
    // transaction, moments ago) makes this `updateMany` match zero rows;
    // throwing here rolls back everything else this attempt just did.
    const claimed = await tx.appOrder.updateMany({
      where: { id: order.id, isDraft: true },
      data: {
        isDraft: false,
        status: "CONFIRMED",
        subtotal,
        couponDiscount: allocatedCoupon,
        walletDiscount: allocatedWallet,
        totalPayable,
        paymentMode: paymentType === "cash" ? "CASH" : "ONLINE",
        paymentStatus: totalPayable <= 0 ? "PAID" : "PENDING",
        servicePin,
        confirmedAt: new Date(),
        platform,
      },
    });
    if (claimed.count === 0) {
      throw ApiError.conflict("This order has already been confirmed");
    }

    if (cart.id) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    }

    if (options.onConfirmedInTx) {
      await options.onConfirmedInTx(tx, order.id);
    }
  });

  await notifyOrderConfirmed(appUserId, order.id, order.orderNumber);
  await notifyFranchisesOfNewBooking(order);
  void smsOnOrderConfirmed(order.id);

  return { servicePin, totalPayable };
}

export async function confirmOrder(
  appUserId: string,
  input: { order_id: string; payment_type: "cash" | "online" },
  platform: AppPlatform,
): Promise<ConfirmOrderResult> {
  const order = await prisma.appOrder.findUnique({ where: { id: input.order_id } });
  if (!order || order.appUserId !== appUserId) {
    throw ApiError.notFound("Order not found");
  }
  if (!order.isDraft) {
    throw ApiError.conflict("This order has already been confirmed");
  }

  const { servicePin, totalPayable } = await finalizeBookingForOrder(
    appUserId,
    order,
    input.payment_type,
    platform,
  );

  return {
    order_number: order.orderNumber,
    order_status: ORDER_STATUS_LABEL.CONFIRMED,
    service_pin: servicePin,
    total_payable: totalPayable,
  };
}

export interface DirectBookingInput {
  lines: Array<{ itemType: "TEST" | "PACKAGE"; itemId: string; familyMemberId: string }>;
  address_id: string;
  slot_id: string;
  date: string;
}

export interface DirectBookingResult {
  order_id: string;
  order_number: string;
  order_status: string;
  service_pin: string;
  total_payable: number;
  slot: string;
}

/** Books explicit lines straight to a CONFIRMED, Cash-on-Collection order —
 *  the WhatsApp assistant's path. It runs the exact pipeline Confirm Order
 *  does (`resolveCheckoutSlot` → `finalizeBookingForOrder`: same pricing,
 *  slot lock, Appointments/Bills, notifications, SMS), but never touches the
 *  user's app `Cart` or their draft AppOrder, and never applies wallet
 *  balance or a coupon. */
export async function createDirectCashBooking(
  appUserId: string,
  input: DirectBookingInput,
  platform: AppPlatform,
  onConfirmedInTx?: FinalizeOptions["onConfirmedInTx"],
): Promise<DirectBookingResult> {
  if (input.lines.length === 0) {
    throw ApiError.badRequest("Nothing to book");
  }

  const address = await prisma.address.findUnique({ where: { id: input.address_id } });
  if (!address || address.appUserId !== appUserId) {
    throw ApiError.notFound("Address not found");
  }

  const memberIds = [...new Set(input.lines.map((l) => l.familyMemberId))];
  const ownedMembers = await prisma.familyMember.count({
    where: { id: { in: memberIds }, appUserId },
  });
  if (ownedMembers !== memberIds.length) {
    throw ApiError.notFound("Family member not found");
  }

  const items = input.lines.map((line, index) => ({ id: `direct-${index}`, ...line }));
  if ((await resolveCartItems(items)).length !== items.length) {
    throw ApiError.badRequest("Item not found or unavailable");
  }

  const slot = await resolveCheckoutSlot(address, input.slot_id, input.date);
  const order: FinalizeOrder = {
    id: randomUUID(),
    orderNumber: await nextAppOrderNumber(),
    slotId: slot.slotId,
    slotTemplateId: slot.slotTemplateId,
    areaId: slot.areaId,
    addressId: address.id,
    orderDate: new Date(input.date),
    phlebotomyCharges: new Prisma.Decimal(slot.phlebotomyCharges),
    organizationId: null,
    serviceCenterId: null,
  };

  const { servicePin, totalPayable } = await finalizeBookingForOrder(
    appUserId,
    order,
    "cash",
    platform,
    {
      cart: { id: null, couponId: null, coupon: null, items },
      applyWallet: false,
      createOrder: {
        appUserId,
        addressId: order.addressId,
        slotId: order.slotId,
        slotTemplateId: order.slotTemplateId,
        areaId: order.areaId,
        orderDate: order.orderDate,
        phlebotomyCharges: order.phlebotomyCharges,
        isDraft: true,
      },
      onConfirmedInTx,
    },
  );

  return {
    order_id: order.id,
    order_number: order.orderNumber,
    order_status: ORDER_STATUS_LABEL.CONFIRMED,
    service_pin: servicePin,
    total_payable: totalPayable,
    slot: slot.slotTitle,
  };
}

export type FinalizeOnlinePaymentBookingResult =
  | { outcome: "confirmed" }
  | { outcome: "already-confirmed" }
  | { outcome: "failed"; error: string };

/** Called only from `paymentFinalize.service.ts`, only after Razorpay has
 *  verified a payment succeeded — this is what actually turns the draft
 *  order into a real booking for the online-payment path (see
 *  `finalizeBookingForOrder`'s doc-comment for why that's now deferred this
 *  late instead of happening up front like it does for Cash on Delivery).
 *
 *  Never throws — a real (if rare) failure here means Razorpay has already
 *  captured the customer's money but the slot/order can't be finalized (most
 *  likely the slot filled up during checkout). That can't be allowed to
 *  surface as an unhandled 500 on the payment-verify request, since the
 *  payment itself already succeeded; the caller logs `"failed"` for manual
 *  refund/reconciliation instead. */
export async function finalizeOnlinePaymentBooking(
  appUserId: string,
  orderId: string,
): Promise<FinalizeOnlinePaymentBookingResult> {
  const order = await prisma.appOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return { outcome: "failed", error: "Order not found" };
  }
  if (!order.isDraft) {
    // Already booked (e.g. a webhook and this call both reacted to the same
    // payment, or it was somehow confirmed through another path) — nothing
    // new to do; the caller still settles the bill against the existing
    // booking exactly as before.
    return { outcome: "already-confirmed" };
  }

  try {
    // Recorded on the draft by `createPaymentOrder`, from the request the
    // patient actually paid through — not the account's last-login platform.
    await finalizeBookingForOrder(appUserId, order, "online", order.platform);
    return { outcome: "confirmed" };
  } catch (error) {
    return { outcome: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

export interface OrderListItem {
  id: string;
  orderNo: string;
  orderType: "CATALOG" | "HOME_VISIT";
  /** Every person on the order, comma-joined — one order can cover several
   *  family members. `patientCount` is that same list's size, so a card can
   *  show "Rahul +2" without splitting the string back apart. */
  patientName: string;
  patientCount: number;
  age: number;
  gender: string;
  bookingDate: string;
  timeSlot: string | null;
  orderStatus: string;
  paymentMode: string;
  bookingAmount: number;
  servicePin: string | null;
  reportUrl: string | null;
}

export async function listOrders(
  appUserId: string,
  status: "all" | "upcoming" | "past" = "all",
): Promise<OrderListItem[]> {
  const orders = await prisma.appOrder.findMany({
    where: { appUserId, isDraft: false },
    include: {
      slot: true,
      slotTemplate: true,
      appointments: { include: { familyMember: { include: { patient: true } } } },
      homeVisitFamilyMember: { include: { patient: true } },
    },
    // A draft reused days later is placed at `confirmedAt`, not `createdAt`.
    orderBy: [{ confirmedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const filtered = orders.filter((order) => {
    if (status === "all") return true;
    const isFinal = order.status === "COMPLETED" || order.status === "CANCELLED";
    const isFuture = order.orderDate >= today;
    return status === "upcoming" ? isFuture && !isFinal : !isFuture || isFinal;
  });

  return filtered.map((order) => {
    const firstPatient =
      order.appointments[0]?.familyMember.patient ?? order.homeVisitFamilyMember?.patient;
    const names =
      order.appointments
        .map((a) => `${a.familyMember.patient.firstName} ${a.familyMember.patient.lastName}`.trim())
        .join(", ") ||
      (order.homeVisitFamilyMember
        ? `${order.homeVisitFamilyMember.patient.firstName} ${order.homeVisitFamilyMember.patient.lastName}`.trim()
        : "");

    return {
      id: order.id,
      orderNo: order.orderNumber,
      orderType: order.orderType,
      patientName: names || "—",
      patientCount: order.appointments.length || (order.homeVisitFamilyMember ? 1 : 0),
      age: firstPatient ? computeAge(firstPatient.dob) : 0,
      gender: firstPatient ? fromDbGender(firstPatient.gender) : "Other",
      bookingDate: order.orderDate.toISOString().slice(0, 10),
      timeSlot: order.slot
        ? `${order.slot.startTime} - ${order.slot.endTime}`
        : order.slotTemplate
          ? `${order.slotTemplate.startTime} - ${order.slotTemplate.endTime}`
          : null,
      orderStatus: ORDER_STATUS_LABEL[order.status],
      paymentMode: order.paymentMode === "CASH" ? "Cash" : "Online",
      bookingAmount: Number(order.totalPayable),
      servicePin: visibleServicePin(order),
      reportUrl: null,
    };
  });
}

export interface OrderDetail {
  id: string;
  orderNo: string;
  orderType: "CATALOG" | "HOME_VISIT";
  /** Only set on a HOME_VISIT order — what the patient described at booking.
   *  `items` is empty until the assigned phlebo has actually added tests. */
  symptomNotes: string | null;
  patients: Array<{ name: string; age: number; gender: string; mobile: string }>;
  bookingDate: string;
  timeSlot: string | null;
  orderStatus: string;
  payment: { paymentMode: string; paymentStatus: string; amount: number };
  address: Record<string, unknown> | null;
  phlebotomist: { id: string; name: string; mobile: string; photoUrl: string | null } | null;
  servicePin: string | null;
  /** Every line, each tagged with the person it was booked for — the same
   *  `familyMemberId` the cart line carried through checkout. One order can
   *  cover several people, so "who is this test for" is per item, not per
   *  order; `patients` above is the de-duplicated list of those people. */
  items: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    familyMemberId: string;
    patientName: string;
    relation: string;
  }>;
  /** Only set on a HOME_VISIT order, and only until `items` is populated —
   *  who the visit is booked for, before there's an AppOrderItem/Appointment
   *  yet to carry that link. */
  homeVisitPatient: { name: string; relation: string } | null;
  reportUrl: null;
}

export async function getOrderDetail(appUserId: string, orderId: string): Promise<OrderDetail> {
  const order = await prisma.appOrder.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      slot: true,
      slotTemplate: true,
      phlebotomist: true,
      // `familyMember.patient` is where the name lives — an AppOrderItem
      // only stores the id, and the app has to show "CBC — for Priya".
      items: { include: { familyMember: { include: { patient: true } } } },
      appointments: {
        include: {
          familyMember: { include: { patient: true } },
          appointment: { include: { tests: true } },
        },
      },
      homeVisitFamilyMember: { include: { patient: true } },
    },
  });

  if (!order || order.appUserId !== appUserId) {
    throw ApiError.notFound("Order not found");
  }

  return {
    id: order.id,
    orderNo: order.orderNumber,
    orderType: order.orderType,
    symptomNotes: order.symptomNotes,
    homeVisitPatient: order.homeVisitFamilyMember
      ? {
          name: `${order.homeVisitFamilyMember.patient.firstName} ${order.homeVisitFamilyMember.patient.lastName}`.trim(),
          relation: toRelationLabel(order.homeVisitFamilyMember.relation),
        }
      : null,
    patients: order.appointments.map((a) => ({
      name: `${a.familyMember.patient.firstName} ${a.familyMember.patient.lastName}`.trim(),
      age: computeAge(a.familyMember.patient.dob),
      gender: fromDbGender(a.familyMember.patient.gender),
      mobile: a.familyMember.patient.mobile,
    })),
    bookingDate: order.orderDate.toISOString().slice(0, 10),
    timeSlot: order.slot
      ? `${order.slot.startTime} - ${order.slot.endTime}`
      : order.slotTemplate
        ? `${order.slotTemplate.startTime} - ${order.slotTemplate.endTime}`
        : null,
    orderStatus: ORDER_STATUS_LABEL[order.status],
    payment: {
      paymentMode: order.paymentMode === "CASH" ? "Cash" : "Online",
      paymentStatus: order.paymentStatus ? fromDbPaymentStatus(order.paymentStatus) : "Pending",
      amount: Number(order.totalPayable),
    },
    address: order.address
      ? {
          address_id: order.address.id,
          address: order.address.address,
          city: order.address.city,
          state: order.address.state,
          pincode: order.address.pincode,
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
    servicePin: visibleServicePin(order),
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
    reportUrl: null,
  };
}

function fromDbPaymentStatus(status: "PAID" | "PARTIAL" | "PENDING"): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

const NON_CANCELLABLE_STATUSES: AppOrderStatus[] = ["SAMPLE_COLLECTED", "COMPLETED", "CANCELLED"];

/** A booking can only move while there is still a visit left to move.
 *  Deliberately stricter than `NON_CANCELLABLE_STATUSES` above by one value:
 *  `SAMPLE_DROPPED` sits AFTER `SAMPLE_COLLECTED` in the workflow, and status
 *  is a single field rather than a set — so an order that has already
 *  progressed to `SAMPLE_DROPPED` no longer matches a `SAMPLE_COLLECTED`
 *  check and would otherwise slip through. `REJECTED` is intentionally
 *  absent: a phlebo declining leaves the booking live and awaiting
 *  re-assignment, so the patient may still move it. */
const NON_RESCHEDULABLE_STATUSES: AppOrderStatus[] = [
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
  "COMPLETED",
  "CANCELLED",
];

export interface RescheduleOrderInput {
  /** yyyy-MM-dd, the new collection date. */
  date: string;
  /** Whatever id Slot Availability returned for that date — a `SlotTemplate`
   *  id under the new engine, a legacy `Slot` id otherwise. Opaque to the
   *  client, exactly as it is at Review Cart. */
  slot_id: string;
}

export interface RescheduleOrderResult {
  order_number: string;
  booking_date: string;
  time_slot: string;
  order_status: string;
}

/** Moves a confirmed booking to a different date/slot, in place — same order,
 *  same order number, same appointments, same money. Only `orderDate` and the
 *  slot pointer change.
 *
 *  Two things it deliberately does NOT do:
 *
 *  - **Change the address.** The address decides the city, the area, the
 *    price list and the phlebotomy charge; moving it would re-price the
 *    booking after payment. A patient who needs a different address cancels
 *    and rebooks.
 *  - **Drop the phlebotomist.** They stay assigned and get told the job moved
 *    (see `notifyBookingRescheduledToPhlebo`). Clearing the assignment would
 *    quietly undo an ops decision; an admin can still re-assign from the
 *    panel, which notifies both sides.
 *
 *  The new slot is validated exactly the way Review Cart validates a first
 *  booking — same `checkSlotAvailability` waterfall, same advisory lock, same
 *  legacy-`Slot` capacity rules — so a slot that could not be booked fresh
 *  cannot be reached by rescheduling into it either. */
export async function rescheduleOrder(
  appUserId: string,
  orderId: string,
  input: RescheduleOrderInput,
): Promise<RescheduleOrderResult> {
  const order = await prisma.appOrder.findUnique({
    where: { id: orderId },
    include: { address: true, phlebotomist: true },
  });

  if (!order || order.appUserId !== appUserId || order.isDraft) {
    throw ApiError.notFound("Order not found");
  }
  if (NON_RESCHEDULABLE_STATUSES.includes(order.status)) {
    throw ApiError.conflict(
      order.status === "CANCELLED"
        ? "This order is cancelled and can no longer be rescheduled"
        : "The sample for this order has already been collected",
    );
  }
  if (!order.address) {
    throw ApiError.badRequest("This order has no collection address to reschedule against");
  }

  const newDate = new Date(input.date);
  const context = await resolveAddressSlotContext(order.address);

  // Resolve the target slot against the order's OWN address — the same
  // branch Review Cart takes, so a city mid-cutover behaves identically for
  // a reschedule and a fresh booking.
  let nextSlotId: string | null = null;
  let nextSlotTemplateId: string | null = null;
  let nextAreaId: string | null = null;
  let slotTitle: string;

  if (context.useNewSlotSystem && context.cityId) {
    const template = await prisma.slotTemplate.findUnique({ where: { id: input.slot_id } });
    if (!template) {
      throw ApiError.notFound("Slot not found");
    }
    const availability = await checkSlotAvailability({
      cityId: context.cityId,
      areaId: context.areaId,
      slotTemplateId: template.id,
      date: input.date,
    });
    if (availability.isBlocked) {
      throw ApiError.conflict(availability.blockReason ?? "This slot is no longer available");
    }
    nextSlotTemplateId = template.id;
    nextAreaId = context.areaId;
    slotTitle = `${template.startTime} - ${template.endTime}`;
  } else {
    const slot = await prisma.slot.findUnique({ where: { id: input.slot_id } });
    if (!slot) {
      throw ApiError.notFound("Slot not found");
    }
    // A legacy `Slot` row carries its own date, so `date` and `slot_id` can
    // contradict each other. Reject that outright rather than booking the
    // slot and stamping a different `orderDate` on the order.
    if (slot.slotDate.toISOString().slice(0, 10) !== input.date) {
      throw ApiError.badRequest("This slot is not on the selected date");
    }
    if (slot.isBlocked || slot.bookedCount >= slot.capacity) {
      throw ApiError.conflict("This slot is no longer available");
    }
    nextSlotId = slot.id;
    slotTitle = `${slot.startTime} - ${slot.endTime}`;
  }

  const sameDate = order.orderDate.toISOString().slice(0, 10) === input.date;
  const sameSlot =
    (nextSlotTemplateId !== null && order.slotTemplateId === nextSlotTemplateId) ||
    (nextSlotId !== null && order.slotId === nextSlotId);
  if (sameDate && sameSlot) {
    throw ApiError.badRequest("This booking is already on that date and slot");
  }

  await prisma.$transaction(async (tx) => {
    if (nextSlotTemplateId && nextAreaId) {
      // Same serialization Confirm Order uses: booked count under the new
      // engine is a live COUNT() over AppOrder rows, so two reschedules
      // racing into the last free spot must not both pass the check.
      await lockSlotForBooking(tx, {
        areaId: nextAreaId,
        slotTemplateId: nextSlotTemplateId,
        date: input.date,
      });

      const area = await tx.area.findUnique({
        where: { id: nextAreaId },
        select: { cityId: true },
      });
      const availability = area
        ? await checkSlotAvailability(
            {
              cityId: area.cityId,
              areaId: nextAreaId,
              slotTemplateId: nextSlotTemplateId,
              date: input.date,
            },
            tx,
          )
        : { isBlocked: true, blockReason: "This slot is no longer available" };

      if (availability.isBlocked) {
        throw ApiError.conflict(availability.blockReason ?? "This slot is no longer available");
      }
      // Nothing to increment — the count is derived from this order's own
      // row, which the update below moves onto the new slot/date.
    } else if (nextSlotId) {
      const freshSlot = await tx.slot.findUnique({ where: { id: nextSlotId } });
      if (!freshSlot || freshSlot.isBlocked || freshSlot.bookedCount >= freshSlot.capacity) {
        throw ApiError.conflict("This slot is no longer available");
      }
      await tx.slot.update({
        where: { id: freshSlot.id },
        data: { bookedCount: { increment: 1 } },
      });
    }

    // Release the seat this booking held on the legacy slot it is leaving.
    // Guarded on `bookedCount > 0` the same way `cancelOrder` guards it, so a
    // counter that has already drifted to 0 can't go negative.
    if (order.slotId && order.slotId !== nextSlotId) {
      const previous = await tx.slot.findUnique({ where: { id: order.slotId } });
      if (previous && previous.bookedCount > 0) {
        await tx.slot.update({
          where: { id: previous.id },
          data: { bookedCount: { decrement: 1 } },
        });
      }
    }

    await tx.appOrder.update({
      where: { id: order.id },
      data: {
        orderDate: newDate,
        slotId: nextSlotId,
        slotTemplateId: nextSlotTemplateId,
        areaId: nextAreaId,
      },
    });
  });

  // After the commit — a push has no business holding the slot lock open.
  // See `orderNotification.service.ts`'s doc-comment.
  const when = `${formatDDMMYYYY(newDate)}, ${slotTitle}`;
  await notifyOrderRescheduled(appUserId, order.id, order.orderNumber, when);
  if (order.phlebotomist) {
    await notifyBookingRescheduledToPhlebo(order.phlebotomist, order.id, order.orderNumber, when);
  }
  // A new address area can hand the booking to a different franchise — tell
  // whoever just became responsible for it.
  if (nextAreaId !== order.areaId) {
    void owningFranchiseIdsFor(order).then((previous) =>
      smsOnFranchiseHandover(order.id, previous),
    );
  }

  return {
    order_number: order.orderNumber,
    booking_date: input.date,
    time_slot: slotTitle,
    order_status: ORDER_STATUS_LABEL[order.status],
  };
}

export async function cancelOrder(
  appUserId: string,
  orderId: string,
  reason: string,
): Promise<void> {
  const order = await prisma.appOrder.findUnique({
    where: { id: orderId },
    // `phlebotomist` only so the cancel can be pushed to whoever was
    // already assigned to collect — see the notify call at the end.
    include: { appointments: true, phlebotomist: true },
  });

  if (!order || order.appUserId !== appUserId || order.isDraft) {
    throw ApiError.notFound("Order not found");
  }
  if (NON_CANCELLABLE_STATUSES.includes(order.status)) {
    throw ApiError.conflict(
      order.status === "CANCELLED"
        ? "This order is already cancelled"
        : "This order can no longer be cancelled",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.appOrder.update({
      where: { id: order.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason },
    });

    if (order.appointments.length > 0) {
      await tx.appointment.updateMany({
        where: { id: { in: order.appointments.map((a) => a.appointmentId) } },
        data: { status: "CANCELLED" },
      });
    }

    if (order.slotId) {
      const slot = await tx.slot.findUnique({ where: { id: order.slotId } });
      if (slot && slot.bookedCount > 0) {
        await tx.slot.update({ where: { id: slot.id }, data: { bookedCount: { decrement: 1 } } });
      }
    }

    const walletRefund = Number(order.walletDiscount);
    if (walletRefund > 0) {
      const wallet = await tx.wallet.findUnique({ where: { appUserId } });
      if (wallet) {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: walletRefund } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: walletRefund,
            source: "REFUND",
            referenceId: order.id,
            balanceAfter: updatedWallet.balance,
          },
        });
      }
    }
  });

  await notifyOrderCancelled(appUserId, order.id, order.orderNumber, reason);
  // A patient can cancel while the phlebo is already travelling, so the
  // assigned one gets told as well (nothing to send if none was assigned).
  if (order.phlebotomist) {
    await notifyBookingCancelledToPhlebo(order.phlebotomist, order.id, order.orderNumber);
  }
}
