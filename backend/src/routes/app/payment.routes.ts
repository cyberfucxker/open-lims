import { Router } from "express";
import * as paymentController from "../../controllers/app/payment.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createPaymentOrderValidation,
  verifyPaymentValidation,
} from "../../validations/app/payment.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/payments/create-order:
 *   post:
 *     tags: [App Payments]
 *     summary: Create a Razorpay order for an order payment or wallet recharge
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purpose, reference_id]
 *             properties:
 *               purpose: { type: string, enum: [order_payment, wallet_recharge, third_party_lab_balance] }
 *               third_party_user_fid: { type: string, description: "Required when purpose is third_party_lab_balance" }
 *               reference_id: { type: string, format: uuid }
 *     responses:
 *       200: { description: Razorpay order created }
 */
router.post(
  "/user/payments/create-order",
  authenticateAppUser,
  createPaymentOrderValidation,
  validate,
  paymentController.createOrder,
);

/**
 * @openapi
 * /api/v1/app/user/payments/verify:
 *   post:
 *     tags: [App Payments]
 *     summary: Verify a Razorpay checkout callback (fast-path — the webhook is the system of record)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               payment_id: { type: string, format: uuid }
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       200: { description: Verification result }
 */
router.post(
  "/user/payments/verify",
  authenticateAppUser,
  verifyPaymentValidation,
  validate,
  paymentController.verify,
);

/**
 * @openapi
 * /api/v1/app/webhooks/razorpay:
 *   post:
 *     tags: [App Payments]
 *     summary: Razorpay server-to-server webhook (X-Razorpay-Signature auth, no Bearer token)
 *     responses:
 *       200: { description: Webhook processed }
 */
router.post("/webhooks/razorpay", paymentController.webhook);

export { router as appPaymentRouter };
