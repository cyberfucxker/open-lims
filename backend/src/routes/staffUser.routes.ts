import { Router } from "express";
import * as staffUserController from "../controllers/staffUser.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createManagerValidation,
  resetManagerPasswordValidation,
  updateManagerValidation,
} from "../validations/staffUser.validation";

/** Superadmin "Team": ADMIN-only management of MANAGER logins. */
const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), staffUserController.list);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createManagerValidation,
  validate,
  staffUserController.create,
);
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateManagerValidation,
  validate,
  staffUserController.update,
);
router.post(
  "/:id/reset-password",
  authenticate,
  requireRole("ADMIN"),
  resetManagerPasswordValidation,
  validate,
  staffUserController.resetPassword,
);

export { router as staffUserRouter };
