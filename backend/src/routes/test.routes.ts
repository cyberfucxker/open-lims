import { Router } from "express";
import * as testController from "../controllers/test.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireModuleAccess } from "../middleware/moduleAccess.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadCatalogueSampleReport, uploadCsv } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createTestValidation,
  listTestsValidation,
  reorderTestParametersValidation,
  setTestPopularValidation,
  testIdParamValidation,
  updateTestValidation,
} from "../validations/test.validation";
import { managerReadAccess } from "../middleware/staffModule.middleware";

const router = Router();

// CSV export/import must be registered before "/:id" so "export"/"import"
// aren't parsed as a test id — same convention as bill.routes.ts.
router.get("/export/csv", authenticate, requireRole("ADMIN"), testController.exportCsv);
router.post("/import/csv", authenticate, requireRole("ADMIN"), uploadCsv, testController.importCsv);

// Read-only catalogue access is also needed by the Collection Center portal
// (it must pick tests when registering a patient), gated by the same
// "patients" module permission as the rest of that flow. Create/update/delete
// stay ADMIN-only.
// Catalogue search in the Orders module's dialogs — see `managerReadAccess`.
router.get(
  "/",
  authenticate,
  managerReadAccess("orders"),
  listTestsValidation,
  validate,
  testController.list,
);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  listTestsValidation,
  validate,
  testController.list,
);
// Registered before "/:id" so "details" isn't swallowed by the id route.
// Same read scope as GET /:id — the Collection Center portal needs to see what
// a Test contains, and the payload has no admin-only fields (see
// catalogDetail.types.ts).
router.get(
  "/:id/details",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  testIdParamValidation,
  validate,
  testController.getDetails,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  testIdParamValidation,
  validate,
  testController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createTestValidation,
  validate,
  testController.create,
);
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateTestValidation,
  validate,
  testController.update,
);
// Toggles the Home screen's "Popular Tests" flag — same convention as the
// Package module's own PATCH /:id/popular, kept off the full-form PATCH /:id
// (whose validation demands every required field) so the Superadmin CMS's
// Popular Tests picker only ever sends the one flag it's changing.
router.patch(
  "/:id/popular",
  authenticate,
  requireRole("ADMIN"),
  setTestPopularValidation,
  validate,
  testController.setPopular,
);
// Drag-reorder of the attached parameter list. Separate from PATCH /:id so the
// UI can persist an order change without re-submitting the whole Test form.
router.patch(
  "/:id/parameters/reorder",
  authenticate,
  requireRole("ADMIN"),
  reorderTestParametersValidation,
  validate,
  testController.reorderParameters,
);
// Sample lab report attachment — separate from PATCH /:id because a multipart
// upload can't share the form's JSON body.
router.post(
  "/:id/sample-report",
  authenticate,
  requireRole("ADMIN"),
  testIdParamValidation,
  validate,
  uploadCatalogueSampleReport,
  testController.uploadSampleReport,
);
router.delete(
  "/:id/sample-report",
  authenticate,
  requireRole("ADMIN"),
  testIdParamValidation,
  validate,
  testController.removeSampleReport,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  testIdParamValidation,
  validate,
  testController.remove,
);

export { router as testRouter };
