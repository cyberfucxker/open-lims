import { Router } from "express";
import * as referralDoctorController from "../controllers/referralDoctor.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  assignReferralDoctorValidation,
  bulkAssignReferralDoctorsValidation,
  createReferralDoctorValidation,
  listReferralDoctorsValidation,
  referralDoctorIdParamValidation,
  setReferralDoctorStatusValidation,
  updateReferralDoctorValidation,
} from "../validations/referralDoctor.validation";

const router = Router();

// Literal-path routes ("/active", "/bulk-assign") must be declared before
// the "/:id" routes below, or Express would match them as an :id.
router.get("/active", authenticate, requireRole("ADMIN"), referralDoctorController.listActive);
router.patch(
  "/bulk-assign",
  authenticate,
  requireRole("ADMIN"),
  bulkAssignReferralDoctorsValidation,
  validate,
  referralDoctorController.bulkAssign,
);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listReferralDoctorsValidation,
  validate,
  referralDoctorController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  referralDoctorIdParamValidation,
  validate,
  referralDoctorController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createReferralDoctorValidation,
  validate,
  referralDoctorController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateReferralDoctorValidation,
  validate,
  referralDoctorController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  referralDoctorIdParamValidation,
  validate,
  referralDoctorController.remove,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  referralDoctorIdParamValidation,
  validate,
  referralDoctorController.restore,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setReferralDoctorStatusValidation,
  validate,
  referralDoctorController.setStatus,
);
router.patch(
  "/:id/assign",
  authenticate,
  requireRole("ADMIN"),
  assignReferralDoctorValidation,
  validate,
  referralDoctorController.assign,
);
router.patch(
  "/:id/transfer",
  authenticate,
  requireRole("ADMIN"),
  assignReferralDoctorValidation,
  validate,
  referralDoctorController.transfer,
);
router.get(
  "/:id/audit-logs",
  authenticate,
  requireRole("ADMIN"),
  referralDoctorIdParamValidation,
  validate,
  referralDoctorController.listAuditLogs,
);

export { router as referralDoctorRouter };
