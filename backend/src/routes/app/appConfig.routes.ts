import { Router } from "express";
import * as appConfigController from "../../controllers/app/appConfig.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/app/config:
 *   get:
 *     tags: [App Settings]
 *     summary: Get app configuration (CMS links, force-update check, support contacts) — public
 *     parameters:
 *       - in: query
 *         name: app_version
 *         schema: { type: string }
 *     responses:
 *       200: { description: App config }
 */
router.get("/config", appConfigController.getConfig);

export { router as appConfigRouter };
