import { Router } from "express";
import * as masterController from "../../controllers/app/master.controller";
import { validate } from "../../middleware/validate.middleware";
import { listCitiesValidation } from "../../validations/app/master.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/master/cities:
 *   get:
 *     tags: [App Master Data]
 *     summary: List serviceable cities (public, no auth) — single canonical
 *       source for the City picker, address forms, Complete Profile, Add
 *       Family Member, Upload Prescription, etc.
 *     parameters:
 *       - in: query
 *         name: state_id
 *         required: false
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: search
 *         required: false
 *         schema: { type: string }
 *         description: Substring match on city name
 *     responses:
 *       200: { description: Cities }
 */
router.get("/master/cities", listCitiesValidation, validate, masterController.listCities);

export { router as appMasterRouter };
