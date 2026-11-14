import { Router } from "express";
import * as sampleController from "../controllers/sample.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireModuleAccess } from "../middleware/moduleAccess.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  appointmentIdParamValidation,
  bulkSampleIdsValidation,
  listSamplesValidation,
  rejectSampleValidation,
  sampleIdParamValidation,
} from "../validations/sample.validation";

const router = Router();

// Collection Center portal ("samples" module): view + collect its own
// samples, plus barcode/label/history read-outs. Receive/reject/bulk/export
// stay ADMIN-only lab-desk operations. See patient.routes.ts for the same
// per-route convention.
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("samples"),
  listSamplesValidation,
  validate,
  sampleController.list,
);

// Export/bulk/batch routes must be registered before "/:id" so they aren't parsed as a sample id.
router.get(
  "/export/excel",
  authenticate,
  requireRole("ADMIN"),
  listSamplesValidation,
  validate,
  sampleController.exportExcel,
);
router.post(
  "/bulk/collect",
  authenticate,
  requireRole("ADMIN"),
  bulkSampleIdsValidation,
  validate,
  sampleController.bulkCollect,
);
router.post(
  "/bulk/receive",
  authenticate,
  requireRole("ADMIN"),
  bulkSampleIdsValidation,
  validate,
  sampleController.bulkReceive,
);
router.post(
  "/bulk/approve",
  authenticate,
  requireRole("ADMIN"),
  bulkSampleIdsValidation,
  validate,
  sampleController.bulkApprove,
);
router.post(
  "/label-pdf/batch",
  authenticate,
  requireRole("ADMIN"),
  bulkSampleIdsValidation,
  validate,
  sampleController.downloadLabelBatchPdf,
);
router.get(
  "/by-appointment/:appointmentId",
  authenticate,
  requireRole("ADMIN"),
  appointmentIdParamValidation,
  validate,
  sampleController.getByAppointment,
);

router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("samples"),
  sampleIdParamValidation,
  validate,
  sampleController.getById,
);
router.patch(
  "/:id/collect",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("samples"),
  sampleIdParamValidation,
  validate,
  sampleController.collect,
);
router.patch(
  "/:id/receive",
  authenticate,
  requireRole("ADMIN"),
  sampleIdParamValidation,
  validate,
  sampleController.receive,
);
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("ADMIN"),
  sampleIdParamValidation,
  validate,
  sampleController.approve,
);
router.patch(
  "/:id/reject",
  authenticate,
  requireRole("ADMIN"),
  rejectSampleValidation,
  validate,
  sampleController.reject,
);
router.get(
  "/:id/barcode",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("samples"),
  sampleIdParamValidation,
  validate,
  sampleController.getBarcode,
);
router.get(
  "/:id/label-pdf",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("samples"),
  sampleIdParamValidation,
  validate,
  sampleController.downloadLabelPdf,
);
router.get(
  "/:id/history",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("samples"),
  sampleIdParamValidation,
  validate,
  sampleController.getHistory,
);

export { router as sampleRouter };
