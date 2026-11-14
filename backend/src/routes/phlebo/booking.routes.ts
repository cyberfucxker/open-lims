import { Router } from "express";
import * as bookingController from "../../controllers/phlebo/booking.controller";
import { authenticatePhlebo } from "../../middleware/phleboAuth.middleware";
import { uploadPhleboStatusPhoto } from "../../middleware/appUpload.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  addBookingItemsValidation,
  bookingIdParamValidation,
  bulkDropSamplesValidation,
  collectCodValidation,
  dropSampleValidation,
  listBookingsValidation,
  removeBookingItemValidation,
  updateBookingStatusValidation,
  verifyBookingPinValidation,
} from "../../validations/phlebo/booking.validation";

const router = Router();

// Literal paths before "/bookings" query route and before "/booking/:id" —
// same convention as phlebotomist.routes.ts's "/active" before "/:id".

/**
 * @openapi
 * /api/v1/sample-boy/bookings/today:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: Bookings — Today
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/BookingList" }
 */
router.get("/bookings/today", authenticatePhlebo, bookingController.listToday);

/**
 * @openapi
 * /api/v1/sample-boy/bookings/upcoming:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: Bookings — Upcoming
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/BookingList" }
 */
router.get("/bookings/upcoming", authenticatePhlebo, bookingController.listUpcoming);

/**
 * @openapi
 * /api/v1/sample-boy/bookings/completed:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: Bookings — Completed
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/BookingList" }
 */
router.get("/bookings/completed", authenticatePhlebo, bookingController.listCompleted);

/**
 * @openapi
 * /api/v1/sample-boy/bookings/cancelled:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: Bookings — Cancelled (includes rejected)
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/BookingList" }
 */
router.get("/bookings/cancelled", authenticatePhlebo, bookingController.listCancelled);

/**
 * @openapi
 * /api/v1/sample-boy/bookings/pending-drop:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: Bookings — Pending Drop (collected, not yet dropped)
 *     description: >
 *       Samples the phlebo has already collected from the patient but not yet dropped off at
 *       the lab/collection point — i.e. bookings currently in `sample_collected` status. This
 *       is the selection list for the bulk sample-drop flow below.
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/BookingList" }
 */
router.get("/bookings/pending-drop", authenticatePhlebo, bookingController.listPendingDrop);

/**
 * @openapi
 * /api/v1/sample-boy/bookings/bulk-sample-drop:
 *   post:
 *     tags: [Phlebo Bookings]
 *     summary: Bulk sample drop
 *     description: >
 *       Drops multiple selected bookings in one call — e.g. after multi-selecting several
 *       "Pending Drop" cards in the app and tapping Submit. Each booking is transitioned
 *       independently: one ineligible/not-owned id in the batch never blocks the rest. The
 *       response is a summary (`dropped_count`/`failed_count`/`failed[]` with a reason per
 *       failed id) rather than an all-or-nothing success/failure.
 *     security: [{ PhleboBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [booking_ids]
 *             properties:
 *               booking_ids:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *                 example: ["b1a2c3d4-...", "e5f6a7b8-..."]
 *               remarks: { type: string, example: "Dropped at Lajpat Nagar collection center" }
 *     responses:
 *       200:
 *         description: Bulk drop summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Dropped 2 of 3 booking(s)" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, example: 3 }
 *                     dropped_count: { type: integer, example: 2 }
 *                     failed_count: { type: integer, example: 1 }
 *                     bookings:
 *                       type: array
 *                       items: { $ref: "#/components/schemas/Booking" }
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           reason: { type: string, example: "Cannot move this booking from \"reached\" to \"sample_dropped\"" }
 */
router.post(
  "/bookings/bulk-sample-drop",
  authenticatePhlebo,
  bulkDropSamplesValidation,
  validate,
  bookingController.bulkDropSamples,
);

/**
 * @openapi
 * /api/v1/sample-boy/bookings:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: List bookings
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             [pending, accepted, started_journey, reached, sample_collected, sample_dropped, completed, rejected, cancelled]
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: per_page
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/BookingList" }
 */
router.get(
  "/bookings",
  authenticatePhlebo,
  listBookingsValidation,
  validate,
  bookingController.list,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: Booking detail
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/Booking" }
 *       404: { description: Booking not found, or not assigned to this phlebotomist }
 */
router.get(
  "/booking/:id",
  authenticatePhlebo,
  bookingIdParamValidation,
  validate,
  bookingController.getById,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}/details:
 *   get:
 *     tags: [Phlebo Bookings]
 *     summary: Full booking detail with tests and packages split out
 *     description: >
 *       Same fields as the Booking object, except `tests` is replaced by two arrays —
 *       `tests` (standalone tests the patient booked, each with its `parameters`) and
 *       `packages` (each with its `tests` → `parameters`, plus any `parameters`
 *       attached to the package directly) — so the app can render expandable rows.
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Full booking detail }
 *       404: { description: Booking not found, or not assigned to this phlebotomist }
 */
router.get(
  "/booking/:id/details",
  authenticatePhlebo,
  bookingIdParamValidation,
  validate,
  bookingController.getFullDetail,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}/status:
 *   post:
 *     tags: [Phlebo Bookings]
 *     summary: Update booking status
 *     description: >
 *       `status` must be a legal next action from the booking's current status (see
 *       `next_actions` on the Booking object) — e.g. from "pending" only "accepted" or
 *       "rejected" are allowed. `latitude`/`longitude` are accepted for live-location
 *       tracking but not yet persisted (future phase).
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, started_journey, reached, sample_collected, sample_dropped, rejected]
 *                 example: "sample_collected"
 *               remarks: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               photo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Status updated" }
 *                 data: { $ref: "#/components/schemas/Booking" }
 *       400: { description: Not a legal transition from the current status }
 *       404: { description: Booking not found, or not assigned to this phlebotomist }
 */
router.post(
  "/booking/:id/status",
  authenticatePhlebo,
  uploadPhleboStatusPhoto,
  updateBookingStatusValidation,
  validate,
  bookingController.updateStatus,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}/verify-pin:
 *   post:
 *     tags: [Phlebo Bookings]
 *     summary: Verify patient PIN
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: PIN verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "PIN verified" }
 *                 data: { $ref: "#/components/schemas/Booking" }
 *       400: { description: Incorrect PIN }
 *       404: { description: Booking not found, or not assigned to this phlebotomist }
 */
router.post(
  "/booking/:id/verify-pin",
  authenticatePhlebo,
  verifyBookingPinValidation,
  validate,
  bookingController.verifyPin,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}/cod-collect:
 *   post:
 *     tags: [Phlebo Bookings]
 *     summary: Collect COD
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks: { type: string }
 *     responses:
 *       200:
 *         description: COD collected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "COD collected" }
 *                 data: { $ref: "#/components/schemas/Booking" }
 *       400: { description: Not a cash-on-delivery order, or already collected }
 *       404: { description: Booking not found, or not assigned to this phlebotomist }
 */
router.post(
  "/booking/:id/cod-collect",
  authenticatePhlebo,
  collectCodValidation,
  validate,
  bookingController.codCollect,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}/sample-drop:
 *   post:
 *     tags: [Phlebo Bookings]
 *     summary: Drop a single sample
 *     description: >
 *       Purpose-built single-booking equivalent of `POST /booking/{id}/status` with
 *       `status=sample_dropped` — only legal from `sample_collected`. For dropping several
 *       bookings at once, use `POST /bookings/bulk-sample-drop` instead.
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks: { type: string }
 *     responses:
 *       200:
 *         description: Sample dropped
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Sample dropped" }
 *                 data: { $ref: "#/components/schemas/Booking" }
 *       400: { description: Not a legal transition (booking is not in sample_collected status) }
 *       404: { description: Booking not found, or not assigned to this phlebotomist }
 */
router.post(
  "/booking/:id/sample-drop",
  authenticatePhlebo,
  dropSampleValidation,
  validate,
  bookingController.dropSample,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}/items:
 *   post:
 *     tags: [Phlebo Bookings]
 *     summary: Add tests to a home-visit booking (one-shot)
 *     description: >
 *       Only legal on a `order_type: "home_visit"` booking — the patient
 *       booked with a symptom, not a test list, and this is the phlebo
 *       deciding what to actually test for after examining them. Only
 *       callable while the booking is `accepted`, `started_journey` or
 *       `reached` — i.e. before the sample is collected. Callable repeatedly:
 *       each call bills only whatever wasn't already added and adds it on
 *       top, growing the order's `amount` rather than fixing it once.
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [test_ids]
 *             properties:
 *               test_ids:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *               package_ids:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tests added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Tests added" }
 *                 data: { $ref: "#/components/schemas/Booking" }
 *       400: { description: Not a home-visit booking, or no tests selected }
 *       404: { description: Booking not found, or not assigned to this phlebotomist }
 *       409: { description: Tests already added, or the visit isn't at a legal stage yet }
 */
router.post(
  "/booking/:id/items",
  authenticatePhlebo,
  addBookingItemsValidation,
  validate,
  bookingController.addItems,
);

/**
 * @openapi
 * /api/v1/sample-boy/booking/{id}/items/{itemId}:
 *   delete:
 *     tags: [Phlebo Bookings]
 *     summary: Remove a test/package from a home-visit booking
 *     description: >
 *       Mirror of the add-items endpoint above — drops one test or package
 *       line (by the `item_id` returned in the booking's `tests`/`packages`,
 *       via `GET /booking/{id}`'s full-detail response), then re-bills the
 *       booking from whatever's left. Same status rules as add. Removing
 *       every line brings the order back to just its phlebotomy charge.
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Test/package removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Test removed" }
 *                 data: { $ref: "#/components/schemas/Booking" }
 *       400: { description: Not a home-visit booking }
 *       404: { description: Booking or item not found, or not assigned to this phlebotomist }
 *       409: { description: The visit isn't at a legal stage yet }
 */
router.delete(
  "/booking/:id/items/:itemId",
  authenticatePhlebo,
  removeBookingItemValidation,
  validate,
  bookingController.removeItem,
);

export { router as phleboBookingRouter };
