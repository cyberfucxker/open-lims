import { Router } from "express";
import * as organizationController from "../controllers/organization.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createOrganizationValidation,
  enableLoginValidation,
  listOrganizationsValidation,
  organizationIdParamValidation,
  setOrganizationStatusValidation,
  setServiceAreasValidation,
  updateLoginValidation,
  updateOrganizationValidation,
} from "../validations/organization.validation";

const router = Router();

// Literal-path routes ("/export/...", "/me") must be declared before the
// "/:id" routes below, or Express would match "export"/"me" as an :id.
router.get(
  "/export/excel",
  authenticate,
  requireRole("ADMIN"),
  listOrganizationsValidation,
  validate,
  organizationController.exportExcel,
);
router.get(
  "/export/pdf",
  authenticate,
  requireRole("ADMIN"),
  listOrganizationsValidation,
  validate,
  organizationController.exportPdf,
);
router.get("/me", authenticate, organizationController.getMine);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listOrganizationsValidation,
  validate,
  organizationController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  organizationIdParamValidation,
  validate,
  organizationController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createOrganizationValidation,
  validate,
  organizationController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateOrganizationValidation,
  validate,
  organizationController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  organizationIdParamValidation,
  validate,
  organizationController.remove,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  organizationIdParamValidation,
  validate,
  organizationController.restore,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setOrganizationStatusValidation,
  validate,
  organizationController.setStatus,
);

router.post(
  "/:id/login",
  authenticate,
  requireRole("ADMIN"),
  enableLoginValidation,
  validate,
  organizationController.enableLogin,
);
router.patch(
  "/:id/login",
  authenticate,
  requireRole("ADMIN"),
  updateLoginValidation,
  validate,
  organizationController.updateLogin,
);
router.delete(
  "/:id/login",
  authenticate,
  requireRole("ADMIN"),
  organizationIdParamValidation,
  validate,
  organizationController.disableLogin,
);

router.get(
  "/:id/audit-logs",
  authenticate,
  requireRole("ADMIN"),
  organizationIdParamValidation,
  validate,
  organizationController.listAuditLogs,
);

router.get(
  "/:id/service-areas",
  authenticate,
  requireRole("ADMIN"),
  organizationIdParamValidation,
  validate,
  organizationController.getServiceAreas,
);
router.put(
  "/:id/service-areas",
  authenticate,
  requireRole("ADMIN"),
  setServiceAreasValidation,
  validate,
  organizationController.setServiceAreas,
);

export { router as organizationRouter };
