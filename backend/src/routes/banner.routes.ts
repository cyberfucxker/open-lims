import { Router } from "express";
import * as bannerController from "../controllers/banner.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadBannerImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  bannerIdParamValidation,
  createBannerValidation,
  listBannersValidation,
  reorderBannersValidation,
  setBannerStatusValidation,
  updateBannerValidation,
} from "../validations/banner.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal paths before "/:id" — same convention as phlebotomist.routes.ts.
router.patch("/reorder", reorderBannersValidation, validate, bannerController.reorder);
router.post("/upload", uploadBannerImage, bannerController.uploadImage);

router.get("/", listBannersValidation, validate, bannerController.list);
router.get("/:id", bannerIdParamValidation, validate, bannerController.getById);
router.post("/", createBannerValidation, validate, bannerController.create);
router.put("/:id", updateBannerValidation, validate, bannerController.update);
router.patch("/:id/status", setBannerStatusValidation, validate, bannerController.setStatus);
router.delete("/:id", bannerIdParamValidation, validate, bannerController.remove);

export { router as bannerRouter };
