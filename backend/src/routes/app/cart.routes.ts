import { Router } from "express";
import * as cartController from "../../controllers/app/cart.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  applyCouponValidation,
  removeCartValidation,
  setCartFamilyMemberValidation,
} from "../../validations/app/cart.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/get-cart:
 *   get:
 *     tags: [App Cart]
 *     summary: Get the current cart with pricing preview
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Cart }
 */
router.get("/user/get-cart", authenticateAppUser, cartController.getCart);

/**
 * @openapi
 * /api/v1/app/user/remove-cart:
 *   post:
 *     tags: [App Cart]
 *     summary: Remove a line item from the cart
 *     description: >
 *       Identify the item to remove either by its own `cart_id` (from Get
 *       Cart/Review Cart), or by replaying the same `type`/`type_id`
 *       (/`family_member_id`) used in Add to Cart.
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cart_id: { type: string, format: uuid, description: "The cart line item's own id" }
 *               type: { type: string, enum: ["1", "3"], description: "1 = package, 3 = test — required if cart_id is omitted" }
 *               type_id: { type: string, format: uuid, description: "Required if cart_id is omitted" }
 *               family_member_id: { type: string, format: uuid, description: "Omit/blank for the account holder — only used when cart_id is omitted" }
 *     responses:
 *       200: { description: Item removed }
 */
router.post(
  "/user/remove-cart",
  authenticateAppUser,
  removeCartValidation,
  validate,
  cartController.removeCartItem,
);

/**
 * @openapi
 * /api/v1/app/user/cart/family-member:
 *   patch:
 *     tags: [App Cart]
 *     summary: Point one cart line — or the whole cart — at a family member
 *     description: >
 *       Send `cart_id` to move a single line, which is how a cart ends up
 *       booking different tests for different people in one order. Omit it
 *       and every line collapses onto that one member, the original
 *       whole-cart picker. Either way, a line that would become an exact
 *       duplicate of an existing one is merged away rather than failing the
 *       request.
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [family_member_id]
 *             properties:
 *               family_member_id: { type: string, format: uuid }
 *               cart_id:
 *                 type: string
 *                 format: uuid
 *                 description: "A cart line id from Get Cart's `cartItems[].id`. Omit to move the whole cart."
 *     responses:
 *       200: { description: Cart updated }
 *       404: { description: Family member or cart item not found }
 */
router.patch(
  "/user/cart/family-member",
  authenticateAppUser,
  setCartFamilyMemberValidation,
  validate,
  cartController.setFamilyMember,
);

/**
 * @openapi
 * /api/v1/app/user/checkout/apply-coupon:
 *   post:
 *     tags: [App Cart]
 *     summary: Apply a coupon to the cart (200 even on business-rule rejection)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [coupon_code]
 *             properties:
 *               coupon_code: { type: string }
 *     responses:
 *       200: { description: Result }
 */
router.post(
  "/user/checkout/apply-coupon",
  authenticateAppUser,
  applyCouponValidation,
  validate,
  cartController.applyCoupon,
);

/**
 * @openapi
 * /api/v1/app/user/checkout/coupon:
 *   delete:
 *     tags: [App Cart]
 *     summary: Remove the coupon applied to the cart (idempotent — no coupon is a successful no-op)
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Coupon removed }
 */
router.delete("/user/checkout/coupon", authenticateAppUser, cartController.removeCoupon);

export { router as appCartRouter };
