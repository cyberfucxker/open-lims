import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  categoryIdParamValidation,
  createCategoryValidation,
  listCategoriesValidation,
  setCategoryStatusValidation,
  updateCategoryValidation,
} from "../validations/category.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listCategoriesValidation,
  validate,
  categoryController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  categoryIdParamValidation,
  validate,
  categoryController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createCategoryValidation,
  validate,
  categoryController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateCategoryValidation,
  validate,
  categoryController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  categoryIdParamValidation,
  validate,
  categoryController.remove,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setCategoryStatusValidation,
  validate,
  categoryController.setStatus,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  categoryIdParamValidation,
  validate,
  categoryController.restore,
);

export { router as categoryRouter };
