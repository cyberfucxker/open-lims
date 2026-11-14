import { delay } from "../delay";
import { MOCK_HOME_COUPONS } from "../data/categories";
import { MOCK_PACKAGES } from "../data/packages";
import { MOCK_TESTS } from "../data/tests";
import { mockDb } from "../state";
import type { CartItemResult, CartResult, RemoveCartRequest } from "@/types";

function resolveCartItem(item: (typeof mockDb.cartItems)[number]): CartItemResult | null {
  if (item.itemType === "TEST") {
    const t = MOCK_TESTS.find((x) => x.id === item.itemId);
    if (!t) return null;
    return {
      id: item.id,
      testName: t.test_name,
      testCode: t.test_code,
      salePrice: t.offer_price,
      mrp: t.price,
      discountPercentage: Math.round(((t.price - t.offer_price) / t.price) * 100),
    };
  }
  const p = MOCK_PACKAGES.find((x) => x.id === item.itemId);
  if (!p) return null;
  return {
    id: item.id,
    testName: p.package_name,
    testCode: p.package_code,
    salePrice: p.offer_price,
    mrp: p.actual_price,
    discountPercentage: Math.round(((p.actual_price - p.offer_price) / p.actual_price) * 100),
  };
}

export const cartApi = {
  async getCart(): Promise<CartResult> {
    const cartItems = mockDb.cartItems.map(resolveCartItem).filter((x): x is CartItemResult => !!x);
    const subtotal = cartItems.reduce((sum, i) => sum + i.salePrice, 0);
    const totalMrp = cartItems.reduce((sum, i) => sum + i.mrp, 0);
    const couponDiscount = mockDb.appliedCoupon?.discountAmount ?? 0;
    const walletDiscount = 0;
    const defaultAddress =
      mockDb.addresses.find((a) => a.is_default) ?? mockDb.addresses[0] ?? null;

    return delay({
      cartItems,
      walletBalance: mockDb.walletBalance,
      couponApplied: mockDb.appliedCoupon,
      paymentSummary: {
        itemCount: cartItems.length,
        totalMrp,
        mrpDiscount: Math.max(totalMrp - subtotal, 0),
        subtotal,
        walletDiscount,
        couponDiscount,
        totalPayable: Math.max(subtotal - couponDiscount - walletDiscount, 0),
      },
      defaultAddress: defaultAddress
        ? { address_id: defaultAddress.id, address: defaultAddress.address }
        : null,
    });
  },

  async removeCartItem(payload: RemoveCartRequest): Promise<null> {
    if ("cart_id" in payload) {
      mockDb.cartItems = mockDb.cartItems.filter((c) => c.id !== payload.cart_id);
    } else {
      const itemType = payload.type === "1" ? "PACKAGE" : "TEST";
      mockDb.cartItems = mockDb.cartItems.filter(
        (c) => !(c.itemType === itemType && c.itemId === payload.type_id),
      );
    }
    return delay(null, 250);
  },

  async applyCoupon(couponCode: string): Promise<{ status: boolean; message: string }> {
    const coupon = MOCK_HOME_COUPONS.find(
      (c) => c.coupon_code.toLowerCase() === couponCode.toLowerCase(),
    );
    if (!coupon) {
      await delay(null, 300);
      return { status: false, message: "Invalid or expired coupon code." };
    }
    const subtotal = mockDb.cartItems
      .map(resolveCartItem)
      .filter((x): x is CartItemResult => !!x)
      .reduce((sum, i) => sum + i.salePrice, 0);
    if (subtotal < coupon.min_booking_amount) {
      await delay(null, 300);
      return {
        status: false,
        message: `Add items worth ₹${coupon.min_booking_amount} or more to use this coupon.`,
      };
    }
    const discountAmount =
      coupon.discount_type === "flat"
        ? coupon.discount_value
        : Math.round((subtotal * coupon.discount_value) / 100);
    mockDb.appliedCoupon = { couponCode: coupon.coupon_code, discountAmount };
    return delay({ status: true, message: "Coupon applied successfully." });
  },

  async removeCoupon(): Promise<null> {
    mockDb.appliedCoupon = null;
    return delay(null, 200);
  },
};
