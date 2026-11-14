import { Router } from "express";
import * as prescriptionController from "../controllers/prescription.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listPrescriptionsValidation,
  prescriptionIdParamValidation,
  setPrescriptionStatusValidation,
} from "../validations/prescription.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

/**
 * @openapi
 * /api/v1/prescriptions:
 *   get:
 *     tags: [Prescriptions]
 *     summary: List patient-uploaded prescriptions awaiting review
 *     description: >
 *       Admin-side queue for the prescriptions patients upload from the app
 *       (POST /api/v1/app/user/prescriptions). Soft-deleted rows — a patient
 *       withdrawing their own upload — are never returned. `statusCounts`
 *       deliberately ignores the `status` filter so the tabs can show the
 *       whole queue rather than only the tab being viewed.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches customer name/mobile, family member name/mobile, or the query text
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [SUBMITTED, APPROVED, REJECTED] }
 *       - in: query
 *         name: cityId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200: { description: Prescriptions }
 */
router.get("/", listPrescriptionsValidation, validate, prescriptionController.list);

/**
 * @openapi
 * /api/v1/prescriptions/{id}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Get one prescription
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Prescription }
 *       404: { description: Not found }
 */
router.get("/:id", prescriptionIdParamValidation, validate, prescriptionController.getById);

/**
 * @openapi
 * /api/v1/prescriptions/{id}/status:
 *   patch:
 *     tags: [Prescriptions]
 *     summary: Approve or reject a prescription
 *     description: >
 *       `rejectionReason` is required when status is REJECTED — it is what the
 *       patient is told, and "rejected" alone leaves them re-uploading the same
 *       unreadable photo. Moving to any other status clears a previous reason.
 *     security: [{ BearerAuth: [] }]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [SUBMITTED, APPROVED, REJECTED] }
 *               rejectionReason: { type: string, maxLength: 500 }
 *     responses:
 *       200: { description: Prescription updated }
 *       400: { description: Rejection reason missing }
 *       404: { description: Not found }
 */
router.patch(
  "/:id/status",
  setPrescriptionStatusValidation,
  validate,
  prescriptionController.setStatus,
);

export { router as prescriptionRouter };
