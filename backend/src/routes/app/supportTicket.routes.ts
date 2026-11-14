import { Router } from "express";
import * as supportTicketController from "../../controllers/app/supportTicket.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { uploadTicketScreenshot } from "../../middleware/appUpload.middleware";
import { validate } from "../../middleware/validate.middleware";
import { reportIssueValidation } from "../../validations/app/supportTicket.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/my-issues:
 *   get:
 *     tags: [App Help Center]
 *     summary: List my support tickets
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Issues }
 */
router.get("/user/my-issues", authenticateAppUser, supportTicketController.list);

/**
 * @openapi
 * /api/v1/app/user/report-issue:
 *   post:
 *     tags: [App Help Center]
 *     summary: Submit a support ticket
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [subject, description]
 *             properties:
 *               subject: { type: string }
 *               description: { type: string, minLength: 10, maxLength: 2000 }
 *               screenshot:
 *                 type: string
 *                 format: binary
 *                 # Quoted: the value contains ": ", which unquoted YAML reads as
 *                 # the start of a nested mapping and rejects.
 *                 description: "Optional — a ticket with no attachment is accepted and stores `screenshot: null`."
 *     responses:
 *       201: { description: Issue reported }
 */
router.post(
  "/user/report-issue",
  authenticateAppUser,
  uploadTicketScreenshot,
  reportIssueValidation,
  validate,
  supportTicketController.reportIssue,
);

export { router as appSupportTicketRouter };
