import { Router } from "express";
import * as referralSourceController from "../controllers/referralSource.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  assignPriceListValidation,
  createReferralSourceValidation,
  listReferralSourcesValidation,
  referralSourceIdParamValidation,
  setReferralSourceStatusValidation,
  updateReferralSourceValidation,
} from "../validations/referralSource.validation";

const router = Router();

// Literal-path routes must be declared before "/:id" routes, or Express
// would match "active"/"all" as an :id.
router.get("/active", authenticate, requireRole("ADMIN"), referralSourceController.listActive);
router.get("/all", authenticate, requireRole("ADMIN"), referralSourceController.listAll);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listReferralSourcesValidation,
  validate,
  referralSourceController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  referralSourceIdParamValidation,
  validate,
  referralSourceController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createReferralSourceValidation,
  validate,
  referralSourceController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateReferralSourceValidation,
  validate,
  referralSourceController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  referralSourceIdParamValidation,
  validate,
  referralSourceController.remove,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  referralSourceIdParamValidation,
  validate,
  referralSourceController.restore,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setReferralSourceStatusValidation,
  validate,
  referralSourceController.setStatus,
);
router.put(
  "/:id/price-list",
  authenticate,
  requireRole("ADMIN"),
  assignPriceListValidation,
  validate,
  referralSourceController.assignPriceList,
);
router.delete(
  "/:id/price-list",
  authenticate,
  requireRole("ADMIN"),
  referralSourceIdParamValidation,
  validate,
  referralSourceController.removePriceList,
);
router.get(
  "/:id/price-list",
  authenticate,
  requireRole("ADMIN"),
  referralSourceIdParamValidation,
  validate,
  referralSourceController.getPriceListAssignment,
);
router.get(
  "/:id/audit-logs",
  authenticate,
  requireRole("ADMIN"),
  referralSourceIdParamValidation,
  validate,
  referralSourceController.listAuditLogs,
);

export { router as referralSourceRouter };
