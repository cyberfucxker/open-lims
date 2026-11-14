import { Router } from "express";
import * as financeReportController from "../controllers/financeReport.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { financeReportValidation } from "../validations/financeReport.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  financeReportValidation,
  validate,
  financeReportController.summary,
);
router.get(
  "/export/excel",
  authenticate,
  requireRole("ADMIN"),
  financeReportValidation,
  validate,
  financeReportController.exportExcel,
);
router.get(
  "/export/pdf",
  authenticate,
  requireRole("ADMIN"),
  financeReportValidation,
  validate,
  financeReportController.exportPdf,
);

export { router as financeReportRouter };
