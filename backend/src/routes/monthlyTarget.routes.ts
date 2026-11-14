import { Router } from "express";
import * as monthlyTargetController from "../controllers/monthlyTarget.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  getMonthlyTargetParamValidation,
  listMonthlyTargetsValidation,
  upsertMonthlyTargetValidation,
} from "../validations/monthlyTarget.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listMonthlyTargetsValidation,
  validate,
  monthlyTargetController.list,
);
router.put(
  "/",
  authenticate,
  requireRole("ADMIN"),
  upsertMonthlyTargetValidation,
  validate,
  monthlyTargetController.upsert,
);
router.get(
  "/:marketingStaffId/:month/:year",
  authenticate,
  requireRole("ADMIN"),
  getMonthlyTargetParamValidation,
  validate,
  monthlyTargetController.getOne,
);

export { router as monthlyTargetRouter };
