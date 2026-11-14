import { Router } from "express";
import * as sitemapController from "../../controllers/app/sitemap.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/app/sitemap-data:
 *   get:
 *     tags: [App Catalog]
 *     summary: Slugs for every active city/test/package — feeds the build-time sitemap generator
 *     description: >
 *       Not a patient-facing endpoint — consumed by
 *       frontend/patient-web/scripts/generate-sitemap.mjs at build time to
 *       write public/sitemap.xml. Public since it carries no pricing or
 *       personal data, just slugs and timestamps.
 *     responses:
 *       200: { description: Sitemap data }
 */
router.get("/sitemap-data", sitemapController.getSitemapData);

export { router as appSitemapRouter };
