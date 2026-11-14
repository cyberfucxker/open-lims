import { Router } from "express";
import * as geocodeController from "../../controllers/app/geocode.controller";
import { validate } from "../../middleware/validate.middleware";
import { geocodeRateLimiter } from "../../middleware/rateLimiter.middleware";
import {
  geocodeReverseValidation,
  geocodeSearchValidation,
} from "../../validations/app/geocode.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/geocode/search:
 *   get:
 *     tags: [App Geocode]
 *     summary: Forward-geocode a free-text query (server-side Nominatim proxy)
 *     description: >
 *       Public, no auth. Proxies OpenStreetMap Nominatim's `/search` with a
 *       proper Referer/User-Agent (see `geocode.service.ts` for why the app
 *       can't just call Nominatim directly from the browser). Backs the
 *       Add Address map picker's search box.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, minLength: 3 }
 *     responses:
 *       200: { description: Nominatim search results, passed through as-is }
 */
router.get(
  "/geocode/search",
  geocodeRateLimiter,
  geocodeSearchValidation,
  validate,
  geocodeController.search,
);

/**
 * @openapi
 * /api/v1/app/geocode/reverse:
 *   get:
 *     tags: [App Geocode]
 *     summary: Reverse-geocode a lat/lon into a structured address (server-side Nominatim proxy)
 *     description: Public, no auth. Backs the map picker's "resolve address at pin" step.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lon
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: Nominatim reverse-geocode result, passed through as-is }
 */
router.get(
  "/geocode/reverse",
  geocodeRateLimiter,
  geocodeReverseValidation,
  validate,
  geocodeController.reverse,
);

export { router as appGeocodeRouter };
