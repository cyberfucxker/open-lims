import { Router } from "express";
import * as landingPageController from "../controllers/landingPage.controller";
import * as bannerController from "../controllers/banner.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadBannerImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  landingPageBodyValidation,
  landingPageIdParamValidation,
  landingPageStatusValidation,
} from "../validations/landingPage.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal paths before "/:id" — same convention as webBanner.routes.ts.
router.post("/upload", uploadBannerImage, bannerController.uploadImage);

router.get("/", landingPageController.list);
router.post("/", landingPageBodyValidation, validate, landingPageController.create);
router.get("/:id", landingPageIdParamValidation, validate, landingPageController.get);
router.put(
  "/:id",
  landingPageIdParamValidation,
  landingPageBodyValidation,
  validate,
  landingPageController.update,
);
router.patch("/:id/status", landingPageStatusValidation, validate, landingPageController.setStatus);
router.delete("/:id", landingPageIdParamValidation, validate, landingPageController.remove);

export { router as landingPageRouter };
