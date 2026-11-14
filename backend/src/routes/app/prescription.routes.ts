import { Router } from "express";
import * as prescriptionController from "../../controllers/app/prescription.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { uploadPrescriptionFile } from "../../middleware/appUpload.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  prescriptionIdParamValidation,
  submitPrescriptionValidation,
} from "../../validations/app/prescription.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/prescriptions:
 *   get:
 *     tags: [App Prescriptions]
 *     summary: List submitted prescriptions
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Prescriptions }
 *   post:
 *     tags: [App Prescriptions]
 *     summary: Submit a prescription for review
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [family_member_id, city_id, prescription_file]
 *             properties:
 *               family_member_id: { type: string, format: uuid }
 *               city_id: { type: string, format: uuid }
 *               query: { type: string }
 *               prescription_file: { type: string, format: binary }
 *     responses:
 *       201: { description: Prescription submitted }
 */
router.get("/user/prescriptions", authenticateAppUser, prescriptionController.list);
router.post(
  "/user/prescriptions",
  authenticateAppUser,
  uploadPrescriptionFile,
  submitPrescriptionValidation,
  validate,
  prescriptionController.submit,
);

/**
 * @openapi
 * /api/v1/app/user/prescriptions/{id}:
 *   delete:
 *     tags: [App Prescriptions]
 *     summary: Delete a prescription
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Prescription deleted }
 */
router.delete(
  "/user/prescriptions/:id",
  authenticateAppUser,
  prescriptionIdParamValidation,
  validate,
  prescriptionController.remove,
);

export { router as appPrescriptionRouter };
