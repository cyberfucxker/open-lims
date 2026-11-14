import { Router } from "express";
import * as referralReportController from "../controllers/referralReport.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  dateRangeValidation,
  rankingValidation,
  revenueTrendValidation,
} from "../validations/referralReport.validation";

const router = Router();

router.get("/dashboard", authenticate, requireRole("ADMIN"), referralReportController.dashboard);
router.get(
  "/revenue",
  authenticate,
  requireRole("ADMIN"),
  revenueTrendValidation,
  validate,
  referralReportController.revenue,
);
router.get(
  "/performance",
  authenticate,
  requireRole("ADMIN"),
  dateRangeValidation,
  validate,
  referralReportController.performance,
);
router.get(
  "/patient-count",
  authenticate,
  requireRole("ADMIN"),
  dateRangeValidation,
  validate,
  referralReportController.patientCount,
);
router.get(
  "/ranking",
  authenticate,
  requireRole("ADMIN"),
  rankingValidation,
  validate,
  referralReportController.ranking,
);
router.get(
  "/type-distribution",
  authenticate,
  requireRole("ADMIN"),
  referralReportController.typeDistribution,
);

export { router as referralReportRouter };
