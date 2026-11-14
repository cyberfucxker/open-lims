import { delay, newId } from "../delay";
import { MockApiError } from "../error";
import { MOCK_PACKAGES } from "../data/packages";
import { MOCK_TESTS } from "../data/tests";
import { buildSlotsForDate } from "../data/slots";
import { mockDb } from "../state";
import type {
  CancelOrderRequest,
  ConfirmOrderRequest,
  ConfirmOrderResult,
  OrderDetail,
  OrderListItem,
  OrdersFilter,
  ReviewCartFamilyMember,
  ReviewCartItem,
  ReviewCartRequest,
  ReviewCartResult,
} from "@/types";

const PHLEBOTOMY_CHARGE = 100;

function resolveItemName(itemType: "TEST" | "PACKAGE", itemId: string) {
  if (itemType === "TEST") {
    const t = MOCK_TESTS.find((x) => x.id === itemId);
    return t ? { name: t.test_name, mrp: t.price, price: t.offer_price } : null;
  }
  const p = MOCK_PACKAGES.find((x) => x.id === itemId);
  return p ? { name: p.package_name, mrp: p.actual_price, price: p.offer_price } : null;
}

export const orderApi = {
  async reviewCart(payload: ReviewCartRequest): Promise<ReviewCartResult> {
    if (mockDb.cartItems.length === 0) {
      throw new MockApiError("Your cart is empty.");
    }
    const address = mockDb.addresses.find((a) => a.id === payload.address_id);
    if (!address) throw new MockApiError("Selected address not found.");
    const slot = buildSlotsForDate(payload.date).find((s) => s.slot_id === payload.slot_id);
    if (!slot || slot.isBlocked) throw new MockApiError("Selected slot is no longer available.");

    const cartItems: ReviewCartItem[] = mockDb.cartItems
      .map((c) => {
        const resolved = resolveItemName(c.itemType, c.itemId);
        if (!resolved) return null;
        const member = mockDb.familyMembers.find((m) => m.id === c.familyMemberId);
        return {
          cart_id: c.id,
          family_member_id: c.familyMemberId,
          family_member_name: member?.name ?? "Self",
          type: c.itemType === "TEST" ? 1 : 2,
          type_label: c.itemType === "TEST" ? "Test" : "Package",
          type_id: c.itemId,
          name: resolved.name,
          mrp: resolved.mrp,
          price: resolved.price,
        } satisfies ReviewCartItem;
      })
      .filter((x): x is ReviewCartItem => !!x);

    const familyMemberIds = Array.from(new Set(cartItems.map((c) => c.family_member_id)));
    const familyMembers: ReviewCartFamilyMember[] = familyMemberIds.map((id) => {
      const member = mockDb.familyMembers.find((m) => m.id === id);
      const items = cartItems
        .filter((c) => c.family_member_id === id)
        .map((c) => ({ name: c.name, price: c.price }));
      return {
        member_id: id,
        name: member?.name ?? "Self",
        relation: member?.relation ?? "Self",
        gender: member?.gender ?? "Other",
        age: member?.age ?? 0,
        dob: member?.dob ?? "",
        items,
      };
    });

    const subtotal = cartItems.reduce((sum, i) => sum + i.price, 0);
    const couponDiscount = mockDb.appliedCoupon?.discountAmount ?? 0;
    const totalPayable = Math.max(subtotal + PHLEBOTOMY_CHARGE - couponDiscount, 0);

    const orderId = newId("order");
    const orderNumber = `LAB${Math.floor(10000 + Math.random() * 89999)}`;
    mockDb.draftOrder = {
      order_id: orderId,
      order_number: orderNumber,
      address_id: payload.address_id,
      slot_id: payload.slot_id,
      slotTitle: slot.title,
      date: payload.date,
    };

    return delay({
      order_id: orderId,
      order_number: orderNumber,
      order_status: "PENDING",
      family_members: familyMembers,
      cart_items: cartItems,
      sample_collection: {
        date: payload.date,
        slot_id: payload.slot_id,
        slot: slot.title,
        address: address as unknown as Record<string, unknown>,
      },
      coupon: mockDb.appliedCoupon
        ? {
            applied: true,
            coupon_id: "coupon_applied",
            coupon_code: mockDb.appliedCoupon.couponCode,
            coupon_discount: mockDb.appliedCoupon.discountAmount,
          }
        : null,
      payment_summary: {
        subtotal,
        phlebotomy_charges: PHLEBOTOMY_CHARGE,
        wallet_discount: 0,
        coupon_discount: couponDiscount,
        total_payable: totalPayable,
      },
    });
  },

  async confirmOrder(payload: ConfirmOrderRequest): Promise<ConfirmOrderResult> {
    const draft = mockDb.draftOrder;
    if (!draft || draft.order_id !== payload.order_id) {
      throw new MockApiError("This order session has expired. Please review your cart again.");
    }
    const address = mockDb.addresses.find((a) => a.id === draft.address_id) ?? mockDb.addresses[0];
    const cartItems = mockDb.cartItems
      .map((c) => resolveItemName(c.itemType, c.itemId))
      .filter((x): x is { name: string; mrp: number; price: number } => !!x);
    const subtotal = cartItems.reduce((sum, i) => sum + i.price, 0);
    const couponDiscount = mockDb.appliedCoupon?.discountAmount ?? 0;
    const totalPayable = Math.max(subtotal + PHLEBOTOMY_CHARGE - couponDiscount, 0);
    const servicePin =
      payload.payment_type === "cash" ? String(Math.floor(1000 + Math.random() * 8999)) : null;

    const listItem: OrderListItem = {
      id: draft.order_id,
      orderNo: draft.order_number,
      orderType: "CATALOG",
      patientName: mockDb.familyMembers[0]?.name ?? "Self",
      age: mockDb.familyMembers[0]?.age ?? 0,
      gender: mockDb.familyMembers[0]?.gender ?? "Other",
      bookingDate: draft.date,
      timeSlot: draft.slotTitle,
      orderStatus: "Confirmed",
      paymentMode: payload.payment_type === "cash" ? "Cash" : "Online",
      bookingAmount: totalPayable,
      servicePin,
      reportUrl: null,
    };
    mockDb.orders = [listItem, ...mockDb.orders];
    mockDb.orderDetails[draft.order_id] = {
      id: draft.order_id,
      orderNo: draft.order_number,
      orderType: "CATALOG",
      symptomNotes: null,
      homeVisitPatient: null,
      patients: [
        {
          name: mockDb.familyMembers[0]?.name ?? "Self",
          age: mockDb.familyMembers[0]?.age ?? 0,
          gender: mockDb.familyMembers[0]?.gender ?? "Other",
          mobile: mockDb.user.mobile,
        },
      ],
      bookingDate: draft.date,
      timeSlot: draft.slotTitle,
      orderStatus: "Confirmed",
      payment: {
        paymentMode: payload.payment_type === "cash" ? "Cash" : "Online",
        paymentStatus: payload.payment_type === "cash" ? "Pending" : "Paid",
        amount: totalPayable,
      },
      address: address
        ? {
            address_id: address.id,
            address: address.address,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          }
        : null,
      phlebotomist: null,
      servicePin,
      items: cartItems.map((c, i) => ({
        id: `item_${i}`,
        name: c.name,
        type: "Package",
        price: c.price,
      })),
      reportUrl: null,
    };

    mockDb.cartItems = [];
    mockDb.appliedCoupon = null;
    mockDb.draftOrder = null;

    return delay({
      order_number: listItem.orderNo,
      order_status: "CONFIRMED",
      service_pin: servicePin,
      total_payable: totalPayable,
    });
  },

  async listOrders(filter: OrdersFilter = "all"): Promise<OrderListItem[]> {
    const today = new Date().toISOString().slice(0, 10);
    let orders = [...mockDb.orders];
    if (filter === "upcoming") orders = orders.filter((o) => o.bookingDate >= today);
    if (filter === "past") orders = orders.filter((o) => o.bookingDate < today);
    return delay(orders);
  },

  async getOrderDetail(id: string): Promise<OrderDetail | null> {
    return delay(mockDb.orderDetails[id] ?? null);
  },

  async cancelOrder(id: string, _payload: CancelOrderRequest): Promise<null> {
    mockDb.orders = mockDb.orders.map((o) =>
      o.id === id ? { ...o, orderStatus: "Cancelled" } : o,
    );
    const detail = mockDb.orderDetails[id];
    if (detail) mockDb.orderDetails[id] = { ...detail, orderStatus: "Cancelled" };
    return delay(null);
  },
};
