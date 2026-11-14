import { Router } from "express";
import * as myReportsController from "../../controllers/app/myReports.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { param } from "express-validator";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

const reportIdValidation = [param("id").isUUID().withMessage("Invalid report id")];

/**
 * @openapi
 * /api/v1/app/user/reports:
 *   get:
 *     tags: [App Reports]
 *     summary: List the patient's (and family members') lab reports
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Reports }
 */
router.get("/user/reports", authenticateAppUser, myReportsController.list);

/**
 * @openapi
 * /api/v1/app/user/reports/{id}/download:
 *   get:
 *     tags: [App Reports]
 *     summary: Download the report PDF
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: PDF file, content: { application/pdf: {} } }
 */
router.get(
  "/user/reports/:id/download",
  authenticateAppUser,
  reportIdValidation,
  validate,
  myReportsController.download,
);

export { router as appMyReportsRouter };
