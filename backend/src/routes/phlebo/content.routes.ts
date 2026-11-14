import { Router } from "express";
import * as contentController from "../../controllers/phlebo/content.controller";
import { authenticatePhlebo } from "../../middleware/phleboAuth.middleware";

const router = Router();

/**
 * @openapi
 * /api/v1/sample-boy/terms-conditions:
 *   get:
 *     tags: [Phlebo Content]
 *     summary: Terms & Conditions
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/ContentPage" }
 */
router.get("/terms-conditions", authenticatePhlebo, contentController.getTermsAndConditions);

/**
 * @openapi
 * /api/v1/sample-boy/privacy-policy:
 *   get:
 *     tags: [Phlebo Content]
 *     summary: Privacy Policy
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/ContentPage" }
 */
router.get("/privacy-policy", authenticatePhlebo, contentController.getPrivacyPolicy);

/**
 * @openapi
 * /api/v1/sample-boy/help-support:
 *   get:
 *     tags: [Phlebo Content]
 *     summary: Help & Support
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/HelpSupport" }
 */
router.get("/help-support", authenticatePhlebo, contentController.getHelpSupport);

export { router as phleboContentRouter };
