import { Router } from "express";
import * as slotController from "../../controllers/app/slot.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { slotAvailabilityValidation } from "../../validations/app/slot.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/slot-availability:
 *   get:
 *     tags: [App Slots]
 *     summary: Get available sample-collection slots for a date
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, example: "2026-07-25" }
 *       - in: query
 *         name: address_id
 *         required: false
 *         schema: { type: string, format: uuid }
 *         description: City/area are resolved from this address (falling back to matching its pincode against a configured Area if it has none set).
 *       - in: query
 *         name: order_id
 *         required: false
 *         schema: { type: string, format: uuid }
 *         description: >
 *           For the Reschedule flow — reads the address off an existing
 *           booking, so the app doesn't have to carry an address id around.
 *           Takes precedence over `address_id` when both are sent, because
 *           PATCH /user/orders/{orderId}/reschedule always validates the new
 *           slot against the order's own address; anything else would list
 *           slots that reschedule then refuses. With neither parameter, the
 *           caller's default address is used.
 *     responses:
 *       200: { description: Slot availability }
 *       404: { description: Address or order not found }
 */
router.get(
  "/user/slot-availability",
  authenticateAppUser,
  slotAvailabilityValidation,
  validate,
  slotController.getSlotAvailability,
);

export { router as appSlotRouter };
