import { Router } from "express";
import * as nearbyLabsController from "../../controllers/app/nearbyLabs.controller";
import { attachAppUserIfPresent } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  centerIdParamValidation,
  listCentersValidation,
} from "../../validations/app/nearbyLabs.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/centers:
 *   get:
 *     tags: [App Nearby Labs]
 *     summary: List nearby diagnostic centers — guest-browsable
 *     description: >
 *       Public: works without a Bearer token, same as GET /user/home and the
 *       catalogue lists. "Which lab is near me" is a question someone asks
 *       BEFORE deciding to sign up, and the payload is franchise directory
 *       data (name, address, phone, coordinates, open/closed) with nothing
 *       patient-specific in it — see `nearbyLabs.service.ts`, which takes no
 *       user id at all. A token, if sent, is still attached for consistency
 *       with the other guest-browsable reads.
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *       - in: query
 *         name: long
 *         schema: { type: number }
 *     responses:
 *       200: { description: Centers }
 */
router.get(
  "/user/centers",
  attachAppUserIfPresent,
  listCentersValidation,
  validate,
  nearbyLabsController.list,
);

/**
 * @openapi
 * /api/v1/app/user/center-details/{id}:
 *   get:
 *     tags: [App Nearby Labs]
 *     summary: Get a diagnostic center's details — guest-browsable
 *     description: Public, same reasoning as the list route above.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Center detail }
 */
router.get(
  "/user/center-details/:id",
  attachAppUserIfPresent,
  centerIdParamValidation,
  validate,
  nearbyLabsController.getById,
);

export { router as appNearbyLabsRouter };
