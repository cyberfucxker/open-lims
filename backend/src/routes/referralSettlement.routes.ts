import { Router } from "express";
import * as referralSettlementController from "../controllers/referralSettlement.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  generateSettlementValidation,
  listReferralSettlementsValidation,
  referralSettlementIdParamValidation,
} from "../validations/referralSettlement.validation";

const router = Router();

// Literal-path routes must be declared before "/:id" routes.
router.get(
  "/export/excel",
  authenticate,
  requireRole("ADMIN"),
  listReferralSettlementsValidation,
  validate,
  referralSettlementController.exportExcel,
);
router.get(
  "/export/pdf",
  authenticate,
  requireRole("ADMIN"),
  listReferralSettlementsValidation,
  validate,
  referralSettlementController.exportPdf,
);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listReferralSettlementsValidation,
  validate,
  referralSettlementController.list,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  generateSettlementValidation,
  validate,
  referralSettlementController.generate,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  referralSettlementIdParamValidation,
  validate,
  referralSettlementController.getById,
);
router.patch(
  "/:id/mark-paid",
  authenticate,
  requireRole("ADMIN"),
  referralSettlementIdParamValidation,
  validate,
  referralSettlementController.markPaid,
);
router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("ADMIN"),
  referralSettlementIdParamValidation,
  validate,
  referralSettlementController.cancel,
);
router.get(
  "/:id/export/pdf",
  authenticate,
  requireRole("ADMIN"),
  referralSettlementIdParamValidation,
  validate,
  referralSettlementController.exportSinglePdf,
);

export { router as referralSettlementRouter };
