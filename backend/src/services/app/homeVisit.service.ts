import type { AppPlatform } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { nextAppOrderNumber } from "../../utils/idGenerator";
import { notifyOrderConfirmed } from "../orderNotification.service";
import { notifyFranchisesOfNewBooking } from "../organizationNotification.service";
import {
  checkSlotAvailability,
  lockSlotForBooking,
  resolveAddressSlotContext,
  resolvePhlebotomyCharge,
} from "../slotAvailability.service";
import { smsOnOrderConfirmed } from "../orderSms.service";

export interface CreateHomeVisitBookingInput {
  family_member_id: string;
  address_id: string;
  slot_id: string;
  date: string;
  symptom_notes: string;
  /** Set when the patient tapped "Book Now" on a specific "Nearest Lab" card
   *  instead of coming through the generic booking flow — routes this order
   *  to that lab's franchise regardless of address-area matching (see
   *  `franchiseOrderScope`). */
  service_center_id?: string;
}

export interface CreateHomeVisitBookingResult {
  order_id: string;
  order_number: string;
  order_status: string;
  service_pin: string;
  total_payable: number;
}

/** Booking creation for a "phlebo decides the tests" visit — no cart, no
 *  test/package selection at all. Mirrors `order.service.ts#reviewCart`'s slot
 *  resolution and `finalizeBookingForOrder`'s slot-locking transaction, minus
 *  everything that assumes a priced cart (coupon, wallet, Appointment/Bill
 *  creation): those only start to exist once the phlebo actually adds tests,
 *  via `appOrder.service.ts#addHomeVisitItems`. The order is CONFIRMED
 *  (not a draft awaiting payment) the moment it's created, since there is
 *  nothing to pay yet — everything is settled COD at the doorstep once the
 *  phlebo has priced the visit. */
export async function createHomeVisitBooking(
  appUserId: string,
  input: CreateHomeVisitBookingInput,
  platform: AppPlatform,
): Promise<CreateHomeVisitBookingResult> {
  const familyMember = await prisma.familyMember.findUnique({
    where: { id: input.family_member_id },
  });
  if (!familyMember || familyMember.appUserId !== appUserId) {
    throw ApiError.notFound("Family member not found");
  }

  const address = await prisma.address.findUnique({ where: { id: input.address_id } });
  if (!address || address.appUserId !== appUserId) {
    throw ApiError.notFound("Address not found");
  }

  if (input.service_center_id) {
    const center = await prisma.serviceCenter.findUnique({
      where: { id: input.service_center_id },
      select: { id: true },
    });
    if (!center) {
      throw ApiError.notFound("Selected lab not found");
    }
  }

  const context = await resolveAddressSlotContext(address);

  let slotId: string | null = null;
  let slotTemplateId: string | null = null;
  let areaId: string | null = null;
  let phlebotomyCharges: number;

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
    slotTemplateId = template.id;
    areaId = context.areaId;
    phlebotomyCharges = await resolvePhlebotomyCharge(context.cityId, context.areaId);
  } else {
    const slot = await prisma.slot.findUnique({ where: { id: input.slot_id } });
    if (!slot) {
      throw ApiError.notFound("Slot not found");
    }
    if (slot.isBlocked || slot.bookedCount >= slot.capacity) {
      throw ApiError.conflict("This slot is no longer available");
    }
    slotId = slot.id;
    phlebotomyCharges = Number(slot.surchargeAmount);
  }

  const servicePin = String(Math.floor(1000 + Math.random() * 9000));
  const orderNumber = await nextAppOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    if (slotTemplateId && areaId) {
      await lockSlotForBooking(tx, { areaId, slotTemplateId, date: input.date });

      const availability = await checkSlotAvailability(
        { cityId: context.cityId!, areaId, slotTemplateId, date: input.date },
        tx,
      );
      if (availability.isBlocked) {
        throw ApiError.conflict(availability.blockReason ?? "This slot is no longer available");
      }
    } else if (slotId) {
      const freshSlot = await tx.slot.findUnique({ where: { id: slotId } });
      if (!freshSlot || freshSlot.isBlocked || freshSlot.bookedCount >= freshSlot.capacity) {
        throw ApiError.conflict("This slot is no longer available");
      }
      await tx.slot.update({
        where: { id: freshSlot.id },
        data: { bookedCount: { increment: 1 } },
      });
    }

    return tx.appOrder.create({
      data: {
        orderNumber,
        appUserId,
        orderType: "HOME_VISIT",
        symptomNotes: input.symptom_notes,
        homeVisitFamilyMemberId: familyMember.id,
        addressId: address.id,
        slotId,
        slotTemplateId,
        areaId,
        serviceCenterId: input.service_center_id ?? null,
        orderDate: new Date(input.date),
        isDraft: false,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        subtotal: 0,
        phlebotomyCharges,
        totalPayable: phlebotomyCharges,
        paymentMode: "CASH",
        paymentStatus: "PENDING",
        servicePin,
        platform,
      },
    });
  });

  await notifyOrderConfirmed(appUserId, order.id, order.orderNumber);
  await notifyFranchisesOfNewBooking(order);
  void smsOnOrderConfirmed(order.id);

  // No auto-assignment here: the phlebo dispatch module (dispatchSettings /
  // autoAssign) lives in the upstream fork and deliberately is not part of
  // this codebase. A home-visit order is created unassigned and picked up
  // from the Superadmin orders screen like any other, the same way a catalog
  // order without auto-assign is. Restore the hook here if dispatch is ever
  // brought over.

  return {
    order_id: order.id,
    order_number: order.orderNumber,
    order_status: "Confirmed",
    service_pin: servicePin,
    total_payable: phlebotomyCharges,
  };
}
