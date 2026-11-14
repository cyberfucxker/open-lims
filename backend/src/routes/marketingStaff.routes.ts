import { Router } from "express";
import * as marketingStaffController from "../controllers/marketingStaff.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createMarketingStaffValidation,
  listMarketingStaffValidation,
  marketingStaffIdParamValidation,
  setMarketingStaffStatusValidation,
  updateMarketingStaffValidation,
} from "../validations/marketingStaff.validation";

const router = Router();

// Literal-path routes must be declared before "/:id" routes, or Express
// would match "active" as an :id.
router.get("/active", authenticate, requireRole("ADMIN"), marketingStaffController.listActive);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listMarketingStaffValidation,
  validate,
  marketingStaffController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  marketingStaffIdParamValidation,
  validate,
  marketingStaffController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createMarketingStaffValidation,
  validate,
  marketingStaffController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateMarketingStaffValidation,
  validate,
  marketingStaffController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  marketingStaffIdParamValidation,
  validate,
  marketingStaffController.remove,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  marketingStaffIdParamValidation,
  validate,
  marketingStaffController.restore,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setMarketingStaffStatusValidation,
  validate,
  marketingStaffController.setStatus,
);
router.get(
  "/:id/audit-logs",
  authenticate,
  requireRole("ADMIN"),
  marketingStaffIdParamValidation,
  validate,
  marketingStaffController.listAuditLogs,
);

export { router as marketingStaffRouter };
