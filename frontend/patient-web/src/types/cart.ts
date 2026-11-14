export interface CartItemResult {
  id: string;
  testName: string;
  testCode: string;
  salePrice: number;
  mrp: number;
  discountPercentage: number;
}

export interface CartCouponApplied {
  couponCode: string;
  discountAmount: number;
}

export interface CartPaymentSummary {
  itemCount: number;
  /** Sum of every line's MRP. */
  totalMrp: number;
  /** `totalMrp − subtotal` — what sale prices already knock off MRP, before any coupon. */
  mrpDiscount: number;
  subtotal: number;
  walletDiscount: number;
  couponDiscount: number;
  totalPayable: number;
}

export interface CartDefaultAddress {
  address_id: string;
  address: string;
}

export interface CartResult {
  cartItems: CartItemResult[];
  walletBalance: number;
  couponApplied: CartCouponApplied | null;
  paymentSummary: CartPaymentSummary;
  defaultAddress: CartDefaultAddress | null;
}

export type RemoveCartRequest =
  { cart_id: string } | { type: "1" | "3"; type_id: string; family_member_id?: string };

export interface ApplyCouponRequest {
  coupon_code: string;
}
