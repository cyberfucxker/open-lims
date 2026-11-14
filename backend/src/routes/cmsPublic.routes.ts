import { Router } from "express";
import * as cmsPublicController from "../controllers/cmsPublic.controller";
import { validate } from "../middleware/validate.middleware";
import { publicCmsPageParamValidation } from "../validations/cmsPage.validation";

const router = Router();

// Intentionally unauthenticated — mirrors appConfig.routes.ts's public
// `/config` endpoint. Consumed by both the Patient App and Phlebo App for
// their static content screens (About/Privacy/Terms/FAQs/etc.).
router.get(
  "/:appType/:slug",
  publicCmsPageParamValidation,
  validate,
  cmsPublicController.getPublicPage,
);

export { router as cmsPublicRouter };
