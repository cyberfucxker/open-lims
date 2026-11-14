import { Router } from "express";
import * as departmentController from "../controllers/department.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createDepartmentValidation,
  departmentIdParamValidation,
  listDepartmentsValidation,
  setDepartmentStatusValidation,
  updateDepartmentValidation,
} from "../validations/department.validation";

const router = Router();

// Each route declares its own requireRole call (rather than one blanket
// router.use) so read-only access for another role is a one-line change
// later without touching the write routes.
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listDepartmentsValidation,
  validate,
  departmentController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  departmentIdParamValidation,
  validate,
  departmentController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createDepartmentValidation,
  validate,
  departmentController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateDepartmentValidation,
  validate,
  departmentController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  departmentIdParamValidation,
  validate,
  departmentController.remove,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setDepartmentStatusValidation,
  validate,
  departmentController.setStatus,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  departmentIdParamValidation,
  validate,
  departmentController.restore,
);

export { router as departmentRouter };
