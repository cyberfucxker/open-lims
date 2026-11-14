import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireModuleAccess } from "../middleware/moduleAccess.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  appointmentIdParamValidation,
  approveTestResultValidation,
  cancelReportValidation,
  combinedPdfValidation,
  listReportsValidation,
  printBatchValidation,
  rejectReportValidation,
  rejectTestResultValidation,
  reportIdParamValidation,
  saveResultsValidation,
  saveTestResultValidation,
  testResultIdParamValidation,
} from "../validations/report.validation";

const router = Router();

// Collection Center portal ("reports" module): view + download its own
// reports (Report Download feature). Entry/approve/submit/reject/cancel stay
// ADMIN-only lab workflow actions. See patient.routes.ts for the same
// per-route convention.
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("reports"),
  listReportsValidation,
  validate,
  reportController.list,
);

// Export/batch routes must be registered before "/:id" so they aren't parsed as a report id.
router.get(
  "/export/excel",
  authenticate,
  requireRole("ADMIN"),
  listReportsValidation,
  validate,
  reportController.exportExcel,
);
router.post(
  "/print-batch",
  authenticate,
  requireRole("ADMIN"),
  printBatchValidation,
  validate,
  reportController.printBatch,
);
router.get(
  "/by-appointment/:appointmentId",
  authenticate,
  requireRole("ADMIN"),
  appointmentIdParamValidation,
  validate,
  reportController.getByAppointment,
);

router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("reports"),
  reportIdParamValidation,
  validate,
  reportController.getById,
);
router.patch(
  "/:id/results",
  authenticate,
  requireRole("ADMIN"),
  saveResultsValidation,
  validate,
  reportController.saveResults,
);
router.patch(
  "/:id/results/:resultId/save",
  authenticate,
  requireRole("ADMIN"),
  saveTestResultValidation,
  validate,
  reportController.saveTestResult,
);
router.patch(
  "/:id/results/:resultId/submit",
  authenticate,
  requireRole("ADMIN"),
  testResultIdParamValidation,
  validate,
  reportController.submitTestResult,
);
router.patch(
  "/:id/results/:resultId/approve",
  authenticate,
  requireRole("ADMIN"),
  approveTestResultValidation,
  validate,
  reportController.approveTestResult,
);
router.patch(
  "/:id/results/:resultId/reject",
  authenticate,
  requireRole("ADMIN"),
  rejectTestResultValidation,
  validate,
  reportController.rejectTestResult,
);
router.patch(
  "/:id/submit",
  authenticate,
  requireRole("ADMIN"),
  reportIdParamValidation,
  validate,
  reportController.submit,
);
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("ADMIN"),
  reportIdParamValidation,
  validate,
  reportController.approve,
);
router.patch(
  "/:id/reject",
  authenticate,
  requireRole("ADMIN"),
  rejectReportValidation,
  validate,
  reportController.reject,
);
router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("ADMIN"),
  cancelReportValidation,
  validate,
  reportController.cancel,
);
router.post(
  "/:id/mark-printed",
  authenticate,
  requireRole("ADMIN"),
  reportIdParamValidation,
  validate,
  reportController.markPrinted,
);
router.post(
  "/:id/pdf/combined",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("reports"),
  combinedPdfValidation,
  validate,
  reportController.downloadCombinedPdf,
);
router.get(
  "/:id/pdf",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("reports"),
  reportIdParamValidation,
  validate,
  reportController.downloadPdf,
);
router.get(
  "/:id/history",
  authenticate,
  requireRole("ADMIN"),
  reportIdParamValidation,
  validate,
  reportController.getHistory,
);

export { router as reportRouter };
