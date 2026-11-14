import { Router } from "express";
import * as webBannerController from "../controllers/webBanner.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadBannerImage } from "../middleware/upload.middleware";
import * as bannerController from "../controllers/banner.controller";
import { validate } from "../middleware/validate.middleware";
import {
  createWebBannerValidation,
  listWebBannersValidation,
  reorderWebBannersValidation,
  setWebBannerStatusValidation,
  updateWebBannerValidation,
  webBannerIdParamValidation,
} from "../validations/webBanner.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal paths before "/:id" — same convention as banner.routes.ts.
router.patch("/reorder", reorderWebBannersValidation, validate, webBannerController.reorder);
// Shares the app-banner uploader and the same `/uploads` destination — one
// image store, and nothing about a hero image differs from a banner image.
router.post("/upload", uploadBannerImage, bannerController.uploadImage);

router.get("/", listWebBannersValidation, validate, webBannerController.list);
router.get("/:id", webBannerIdParamValidation, validate, webBannerController.getById);
router.post("/", createWebBannerValidation, validate, webBannerController.create);
router.put("/:id", updateWebBannerValidation, validate, webBannerController.update);
router.patch("/:id/status", setWebBannerStatusValidation, validate, webBannerController.setStatus);
router.delete("/:id", webBannerIdParamValidation, validate, webBannerController.remove);

export { router as webBannerRouter };
