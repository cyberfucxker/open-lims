import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { CartResult, RemoveCartRequest } from "@/types";

interface ApplyCouponResult {
  status: boolean;
  message: string;
}

/** Real replacement for `mocks/api/cartApi.ts` — same shapes as
 *  `GET /user/get-cart`, `POST /user/remove-cart`,
 *  `POST /user/checkout/apply-coupon`. */
export const cartApi = {
  async getCart(): Promise<CartResult> {
    const response = await httpClient.get<AppApiResponseBody<CartResult>>("/user/get-cart");
    return response.data.data as CartResult;
  },

  async removeCartItem(payload: RemoveCartRequest): Promise<null> {
    await httpClient.post("/user/remove-cart", payload);
    return null;
  },

  /** Reassigns every item currently in the cart to one family member —
   *  matches `PATCH /user/cart/family-member`. Backs the checkout flow's
   *  "book this for..." picker shown alongside address selection. */
  async setFamilyMember(familyMemberId: string): Promise<null> {
    await httpClient.patch("/user/cart/family-member", { family_member_id: familyMemberId });
    return null;
  },

  /** Deliberate dual-outcome backend design: business-rule rejections
   *  (invalid code, below minimum subtotal, etc.) come back as a normal 200
   *  with `status: false` in the envelope itself, not an HTTP error — so the
   *  result is read straight off the envelope, not `.data`. */
  async applyCoupon(couponCode: string): Promise<ApplyCouponResult> {
    const response = await httpClient.post<AppApiResponseBody<null>>(
      "/user/checkout/apply-coupon",
      {
        coupon_code: couponCode,
      },
    );
    return { status: response.data.status, message: response.data.message };
  },

  /** `DELETE /user/checkout/coupon` — idempotent, so a double click or a
   *  stale cart (coupon already gone) still succeeds. */
  async removeCoupon(): Promise<null> {
    await httpClient.delete("/user/checkout/coupon");
    return null;
  },
};
