import { Router } from "express";
import { param } from "express-validator";
import * as cmsPublicController from "../controllers/cmsPublic.controller";
import { validate } from "../middleware/validate.middleware";

const router = Router();

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugParamValidation = [
  param("slug").trim().toLowerCase().matches(SLUG_RE).withMessage("Invalid page slug"),
];

// `/phlebo/:slug` (2 path segments) and `/:slug` (1 segment) never collide —
// order between them doesn't matter, Express dispatches by segment count.
router.get("/phlebo/:slug", slugParamValidation, validate, cmsPublicController.getPhleboPageHtml);
router.get("/:slug", slugParamValidation, validate, cmsPublicController.getUserPageHtml);

export { router as cmsPublicHtmlRouter };
