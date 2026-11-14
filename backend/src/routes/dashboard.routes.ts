import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { dashboardSummaryValidation } from "../validations/dashboard.validation";

const router = Router();

router.get(
  "/summary",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  dashboardSummaryValidation,
  validate,
  dashboardController.summary,
);

export { router as dashboardRouter };
