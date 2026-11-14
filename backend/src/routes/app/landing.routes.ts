import { Router } from "express";
import * as landingController from "../../controllers/app/landing.controller";
import { attachAppUserIfPresent } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { landingPageSlugParamValidation } from "../../validations/landingPage.validation";

const router = Router();

router.get(
  "/landing/:slug",
  attachAppUserIfPresent,
  landingPageSlugParamValidation,
  validate,
  landingController.getBySlug,
);

export { router as appLandingRouter };
