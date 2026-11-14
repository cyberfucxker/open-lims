import { Router } from "express";
import * as marketingReportController from "../controllers/marketingReport.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  leaderboardValidation,
  monthlyReportValidation,
} from "../validations/marketingReport.validation";

const router = Router();

// Literal-path routes must be declared before any future "/:id" route.
router.get(
  "/monthly/export",
  authenticate,
  requireRole("ADMIN"),
  monthlyReportValidation,
  validate,
  marketingReportController.exportMonthlyReportExcel,
);
router.get(
  "/monthly",
  authenticate,
  requireRole("ADMIN"),
  monthlyReportValidation,
  validate,
  marketingReportController.monthlyReport,
);
router.get(
  "/leaderboard",
  authenticate,
  requireRole("ADMIN"),
  leaderboardValidation,
  validate,
  marketingReportController.leaderboard,
);
router.get(
  "/dashboard-summary",
  authenticate,
  requireRole("ADMIN"),
  marketingReportController.dashboardSummary,
);

export { router as marketingReportRouter };
