import { Router } from "express";
import * as orderController from "../../controllers/app/order.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  cancelOrderValidation,
  createHomeVisitValidation,
  rescheduleOrderValidation,
  confirmOrderValidation,
  listOrdersValidation,
  orderIdParamValidation,
  reviewCartValidation,
} from "../../validations/app/order.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/review-cart:
 *   post:
 *     tags: [App Orders]
 *     summary: Review the cart against an address/slot/date (creates a draft order)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id, slot_id, date]
 *             properties:
 *               address_id: { type: string, format: uuid }
 *               slot_id: { type: string, format: uuid }
 *               date: { type: string, example: "2026-07-25" }
 *     responses:
 *       200: { description: Draft order preview }
 */
router.post(
  "/user/review-cart",
  authenticateAppUser,
  reviewCartValidation,
  validate,
  orderController.reviewCart,
);

/**
 * @openapi
 * /api/v1/app/user/confirm-order:
 *   post:
 *     tags: [App Orders]
 *     summary: Confirm a draft order (creates the Appointment/Bill rows and clears the cart)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, payment_type]
 *             properties:
 *               order_id: { type: string, format: uuid }
 *               payment_type: { type: string, enum: [cash, online] }
 *     responses:
 *       200: { description: Order confirmed }
 */
router.post(
  "/user/confirm-order",
  authenticateAppUser,
  confirmOrderValidation,
  validate,
  orderController.confirmOrder,
);

/**
 * @openapi
 * /api/v1/app/user/orders:
 *   get:
 *     tags: [App Orders]
 *     summary: List the logged-in patient's orders
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, upcoming, past] }
 *     responses:
 *       200: { description: Orders }
 */
router.get(
  "/user/orders",
  authenticateAppUser,
  listOrdersValidation,
  validate,
  orderController.listOrders,
);

/**
 * @openapi
 * /api/v1/app/user/orders/{id}:
 *   get:
 *     tags: [App Orders]
 *     summary: Get an order's details
 *     description: >
 *       One order can cover several family members. `patients[]` is the
 *       de-duplicated list of everyone on it, and every entry of `items[]`
 *       carries the `familyMemberId`/`patientName` it was booked for, so the
 *       app can group tests under each person.
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     patients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string }
 *                           age: { type: integer }
 *                           gender: { type: string }
 *                           mobile: { type: string }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           name: { type: string, example: "Complete Blood Count" }
 *                           type: { type: string, enum: [Test, Package] }
 *                           price: { type: number, example: 188 }
 *                           familyMemberId: { type: string, format: uuid }
 *                           patientName: { type: string, example: "Priya Sharma" }
 *                           relation: { type: string, example: "SPOUSE" }
 */
router.get(
  "/user/orders/:id",
  authenticateAppUser,
  orderIdParamValidation,
  validate,
  orderController.getOrderDetail,
);

/**
 * @openapi
 * /api/v1/app/user/orders/{orderId}/cancel:
 *   patch:
 *     tags: [App Orders]
 *     summary: Cancel a booked order
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: "Changed my mind" }
 *     responses:
 *       200: { description: Order cancelled }
 */
/**
 * @openapi
 * /api/v1/app/user/orders/{orderId}/reschedule:
 *   patch:
 *     tags: [App Orders]
 *     summary: Move a booked order to a different date and slot
 *     description: >
 *       Same order, order number, appointments and amount — only the
 *       collection date and slot change. The new slot is validated exactly
 *       the way Review Cart validates a first booking, so a slot that could
 *       not be booked fresh cannot be reached by rescheduling into it.
 *       `slot_id` is whatever id Slot Availability returned for the new date.
 *       The booking's address is not changeable here; an assigned
 *       phlebotomist stays assigned and is notified that the job moved.
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, slot_id]
 *             properties:
 *               date: { type: string, example: "2026-09-12" }
 *               slot_id: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order rescheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Order rescheduled successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_number: { type: string, example: "ORD000043" }
 *                     booking_date: { type: string, example: "2026-09-12" }
 *                     time_slot: { type: string, example: "08:00 - 10:00" }
 *                     order_status: { type: string, example: "Confirmed" }
 *       400: { description: Bad date/slot pair, or already on that date and slot }
 *       404: { description: Order or slot not found }
 *       409: { description: Sample already collected, or the slot is unavailable }
 */
router.patch(
  "/user/orders/:orderId/reschedule",
  authenticateAppUser,
  rescheduleOrderValidation,
  validate,
  orderController.rescheduleOrder,
);

router.patch(
  "/user/orders/:orderId/cancel",
  authenticateAppUser,
  cancelOrderValidation,
  validate,
  orderController.cancelOrder,
);

/**
 * @openapi
 * /api/v1/app/user/home-visits:
 *   post:
 *     tags: [App Orders]
 *     summary: Book a symptom-based home visit (phlebo decides the tests on-site)
 *     description: >
 *       No test/package selection — the patient describes a problem and the
 *       phlebotomist assigned to the booking decides what to test for once
 *       they've actually examined the patient. `total_payable` is the
 *       phlebotomy visit charge only; the rest of the amount is fixed once
 *       tests are added and is collected COD at the doorstep, same as every
 *       other order.
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [family_member_id, address_id, slot_id, date, symptom_notes]
 *             properties:
 *               family_member_id: { type: string, format: uuid }
 *               address_id: { type: string, format: uuid }
 *               slot_id: { type: string, format: uuid }
 *               date: { type: string, example: "2026-09-26" }
 *               symptom_notes: { type: string, example: "Fever and body ache for 3 days" }
 *     responses:
 *       200: { description: Home visit booked }
 */
router.post(
  "/user/home-visits",
  authenticateAppUser,
  createHomeVisitValidation,
  validate,
  orderController.createHomeVisit,
);

export { router as appOrderRouter };
