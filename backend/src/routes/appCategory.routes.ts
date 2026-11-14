import { Router } from "express";
import * as appCategoryController from "../controllers/appCategory.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadAppCategoryImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  appCategoryIdParamValidation,
  createAppCategoryValidation,
  listAppCategoriesValidation,
  reorderAppCategoriesValidation,
  setAppCategoryStatusValidation,
  updateAppCategoryValidation,
} from "../validations/appCategory.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal paths before "/:id" — same convention as phlebotomist.routes.ts.
router.patch("/reorder", reorderAppCategoriesValidation, validate, appCategoryController.reorder);
router.post("/upload", uploadAppCategoryImage, appCategoryController.uploadImage);

router.get("/", listAppCategoriesValidation, validate, appCategoryController.list);
router.get("/:id", appCategoryIdParamValidation, validate, appCategoryController.getById);
router.post("/", createAppCategoryValidation, validate, appCategoryController.create);
router.put("/:id", updateAppCategoryValidation, validate, appCategoryController.update);
router.patch(
  "/:id/status",
  setAppCategoryStatusValidation,
  validate,
  appCategoryController.setStatus,
);
router.delete("/:id", appCategoryIdParamValidation, validate, appCategoryController.remove);

export { router as appCategoryRouter };
