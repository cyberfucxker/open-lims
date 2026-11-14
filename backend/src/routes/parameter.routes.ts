import { Router } from "express";
import * as parameterController from "../controllers/parameter.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireModuleAccess } from "../middleware/moduleAccess.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadCatalogueSampleReport, uploadCsv } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createParameterValidation,
  listParametersValidation,
  parameterIdParamValidation,
  updateParameterValidation,
} from "../validations/parameter.validation";

const router = Router();

// CSV export/import must be registered before "/:id" so "export"/"import"
// aren't parsed as a parameter id — same convention as bill.routes.ts.
router.get("/export/csv", authenticate, requireRole("ADMIN"), parameterController.exportCsv);
router.post(
  "/import/csv",
  authenticate,
  requireRole("ADMIN"),
  uploadCsv,
  parameterController.importCsv,
);

// Read-only access is also needed by the Collection Center portal, which has to
// see what a Test contains when registering a patient — gated by the same
// "patients" module permission as the rest of that flow, exactly like
// test.routes.ts. Create/update/delete stay ADMIN-only.
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  listParametersValidation,
  validate,
  parameterController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  parameterIdParamValidation,
  validate,
  parameterController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createParameterValidation,
  validate,
  parameterController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateParameterValidation,
  validate,
  parameterController.update,
);
// PATCH kept alongside PUT because the rest of the admin catalogue mixes both
// (tests PATCH, packages PUT) and the frontend shouldn't have to care.
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateParameterValidation,
  validate,
  parameterController.update,
);
// Sample lab report attachment. Separate from PUT/PATCH /:id because a
// multipart upload can't share the form's JSON body.
router.post(
  "/:id/sample-report",
  authenticate,
  requireRole("ADMIN"),
  parameterIdParamValidation,
  validate,
  uploadCatalogueSampleReport,
  parameterController.uploadSampleReport,
);
router.delete(
  "/:id/sample-report",
  authenticate,
  requireRole("ADMIN"),
  parameterIdParamValidation,
  validate,
  parameterController.removeSampleReport,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  parameterIdParamValidation,
  validate,
  parameterController.remove,
);

export { router as parameterRouter };
