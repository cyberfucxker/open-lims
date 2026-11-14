import { Router } from "express";
import * as cmsPageController from "../controllers/cmsPage.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadCmsImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  cmsPageIdParamValidation,
  createCmsPageValidation,
  listCmsPagesValidation,
  setCmsPageStatusValidation,
  updateCmsPageValidation,
} from "../validations/cmsPage.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal path before "/:id" — same convention as coupon.routes.ts/banner.routes.ts.
router.post("/upload", uploadCmsImage, cmsPageController.uploadImage);

router.get("/", listCmsPagesValidation, validate, cmsPageController.list);
router.get("/:id", cmsPageIdParamValidation, validate, cmsPageController.getById);
router.post("/", createCmsPageValidation, validate, cmsPageController.create);
router.put("/:id", updateCmsPageValidation, validate, cmsPageController.update);
router.patch("/:id/status", setCmsPageStatusValidation, validate, cmsPageController.setStatus);
router.post("/:id/duplicate", cmsPageIdParamValidation, validate, cmsPageController.duplicate);
router.delete("/:id", cmsPageIdParamValidation, validate, cmsPageController.remove);

export { router as cmsPageRouter };
