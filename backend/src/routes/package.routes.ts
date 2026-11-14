import { Router } from "express";
import * as packageController from "../controllers/package.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadCatalogueSampleReport, uploadCsv } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createPackageValidation,
  listPackagesValidation,
  packageIdParamValidation,
  setPackagePopularValidation,
  setPackageStatusValidation,
  updatePackageValidation,
} from "../validations/package.validation";
import { managerReadAccess } from "../middleware/staffModule.middleware";

const router = Router();

// CSV export/import must be registered before "/:id" so "export"/"import"
// aren't parsed as a package id — same convention as bill.routes.ts.
router.get("/export/csv", authenticate, requireRole("ADMIN"), packageController.exportCsv);
router.post(
  "/import/csv",
  authenticate,
  requireRole("ADMIN"),
  uploadCsv,
  packageController.importCsv,
);

// Catalogue search in the Orders module's dialogs — see `managerReadAccess`.
router.get(
  "/",
  authenticate,
  managerReadAccess("orders"),
  listPackagesValidation,
  validate,
  packageController.list,
);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listPackagesValidation,
  validate,
  packageController.list,
);
// Registered before "/:id" so "details" isn't swallowed by the id route.
router.get(
  "/:id/details",
  authenticate,
  requireRole("ADMIN"),
  packageIdParamValidation,
  validate,
  packageController.getDetails,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  packageIdParamValidation,
  validate,
  packageController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createPackageValidation,
  validate,
  packageController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updatePackageValidation,
  validate,
  packageController.update,
);
// Sample lab report attachment — separate from PUT /:id because a multipart
// upload can't share the form's JSON body.
router.post(
  "/:id/sample-report",
  authenticate,
  requireRole("ADMIN"),
  packageIdParamValidation,
  validate,
  uploadCatalogueSampleReport,
  packageController.uploadSampleReport,
);
router.delete(
  "/:id/sample-report",
  authenticate,
  requireRole("ADMIN"),
  packageIdParamValidation,
  validate,
  packageController.removeSampleReport,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  packageIdParamValidation,
  validate,
  packageController.remove,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  packageIdParamValidation,
  validate,
  packageController.restore,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setPackageStatusValidation,
  validate,
  packageController.setStatus,
);
router.patch(
  "/:id/popular",
  authenticate,
  requireRole("ADMIN"),
  setPackagePopularValidation,
  validate,
  packageController.setPopular,
);

export { router as packageRouter };
