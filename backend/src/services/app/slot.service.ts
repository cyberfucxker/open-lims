import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/database";
import { getCityDaySlots, resolveAddressSlotContext } from "../slotAvailability.service";

function to12Hour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export interface SlotAvailabilityResult {
  city: string | null;
  date: string;
  slots: Array<{ slot_id: string; title: string; isBlocked: boolean; blockReason: string | null }>;
}

const ADDRESS_SELECT = {
  id: true,
  appUserId: true,
  city: true,
  areaId: true,
  pincode: true,
} as const;

export interface SlotAvailabilityScope {
  /** An explicit Address to price/validate against. */
  addressId?: string;
  /** An existing booking to read the address off — the Reschedule flow,
   *  where the app holds an order id and no address id. */
  orderId?: string;
}

/** Which Address this lookup is for. `orderId` deliberately WINS over
 *  `addressId` when a caller sends both: `rescheduleOrder` always validates
 *  the new slot against the order's own address, so this list has to be
 *  computed against that same address or it would offer slots the reschedule
 *  then rejects. With neither, it falls back to the caller's default address
 *  — this endpoint's original behaviour, kept for clients that send nothing.
 *
 *  A draft order reads as not-found here for the same reason it does in
 *  `rescheduleOrder`: there is nothing booked yet to reschedule, and the
 *  checkout flow it belongs to already knows its own `address_id`. */
async function resolveScopeAddress(appUserId: string, scope: SlotAvailabilityScope) {
  if (scope.orderId) {
    const order = await prisma.appOrder.findUnique({
      where: { id: scope.orderId },
      select: { appUserId: true, isDraft: true, address: { select: ADDRESS_SELECT } },
    });
    if (!order || order.appUserId !== appUserId || order.isDraft) {
      throw ApiError.notFound("Order not found");
    }
    if (!order.address) {
      throw ApiError.badRequest("This order has no collection address");
    }
    return order.address;
  }

  if (scope.addressId) {
    const address = await prisma.address.findUnique({
      where: { id: scope.addressId },
      select: ADDRESS_SELECT,
    });
    if (!address || address.appUserId !== appUserId) {
      throw ApiError.notFound("Address not found");
    }
    return address;
  }

  return prisma.address.findFirst({
    where: { appUserId, isDefault: true },
    select: ADDRESS_SELECT,
  });
}

/** Resolves city/area from `address_id` — or, for the Reschedule flow, from
 *  the address already on `order_id` — falling back to the caller's default
 *  Address when neither is given (this endpoint's original behavior, kept
 *  for any client not yet sending either). If that city has
 *  been cut over (`City.useNewSlotSystem`), runs the new Slot Template
 *  engine — which itself falls back to matching the address's pincode
 *  against a configured Area when the address has no `areaId` yet (see
 *  `resolveAddressSlotContext`) — otherwise falls through to the untouched
 *  legacy `Slot`/`centerId:null` logic; this is what makes the per-city
 *  cutover flag real: a city left on the legacy flag sees zero behavior
 *  change. */
export async function getSlotAvailability(
  appUserId: string,
  date: string,
  scope: SlotAvailabilityScope = {},
): Promise<SlotAvailabilityResult> {
  const address = await resolveScopeAddress(appUserId, scope);

  const context = address
    ? await resolveAddressSlotContext(address)
    : { cityId: null, areaId: null, useNewSlotSystem: false };

  if (context.useNewSlotSystem && context.cityId) {
    const daySlots = await getCityDaySlots({
      cityId: context.cityId,
      areaId: context.areaId,
      date,
    });
    return {
      city: address?.city ?? null,
      date,
      slots: daySlots.map((s) => ({
        slot_id: s.slotTemplateId,
        title: s.title,
        isBlocked: s.isBlocked,
        blockReason: s.blockReason,
      })),
    };
  }

  const slots = await prisma.slot.findMany({
    where: { centerId: null, slotDate: new Date(date) },
    orderBy: { startTime: "asc" },
  });

  return {
    city: address?.city ?? null,
    date,
    slots: slots.map((slot) => {
      const isBlocked = slot.isBlocked || slot.bookedCount >= slot.capacity;
      return {
        slot_id: slot.id,
        title: `${to12Hour(slot.startTime)} - ${to12Hour(slot.endTime)}`,
        isBlocked,
        blockReason: isBlocked ? "Slot unavailable" : null,
      };
    }),
  };
}
