import { body } from "express-validator";

export const removeCartValidation = [
  body("cart_id").optional().trim().isUUID().withMessage("Invalid cart_id"),
  body("type").optional().isIn(["1", "3"]).withMessage("type must be 1 (package) or 3 (test)"),
  body("type_id").optional().trim().isUUID().withMessage("Invalid type_id"),
  body("family_member_id").optional().trim().isUUID().withMessage("Invalid family_member_id"),
  body().custom((value: { cart_id?: string; type?: string; type_id?: string }) => {
    if (!value.cart_id && !(value.type && value.type_id)) {
      throw new Error("Provide either cart_id, or type + type_id");
    }
    return true;
  }),
];

export const applyCouponValidation = [
  body("coupon_code").trim().notEmpty().withMessage("coupon_code is required"),
];

export const setCartFamilyMemberValidation = [
  body("family_member_id").trim().isUUID().withMessage("Invalid family_member_id"),
  // Present = move just that line; absent = move the whole cart.
  body("cart_id").optional().trim().isUUID().withMessage("Invalid cart_id"),
];
