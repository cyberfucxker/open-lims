import { Router } from "express";
import * as billController from "../controllers/bill.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireModuleAccess } from "../middleware/moduleAccess.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  addPaymentValidation,
  billIdParamValidation,
  listBillsValidation,
  sendInvoiceValidation,
  updateAdditionalChargesValidation,
} from "../validations/bill.validation";

const router = Router();

// Collection Center portal ("invoices" module): view + download its own
// bills (Invoice Access feature). Additional-charges/cancel/payments/send
// stay ADMIN-only billing-desk operations. See patient.routes.ts for the
// same per-route convention.
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("invoices"),
  listBillsValidation,
  validate,
  billController.list,
);

// Export routes must be registered before "/:id" so "export" isn't parsed as a bill id.
router.get(
  "/export/excel",
  authenticate,
  requireRole("ADMIN"),
  listBillsValidation,
  validate,
  billController.exportExcel,
);
router.get(
  "/export/pdf",
  authenticate,
  requireRole("ADMIN"),
  listBillsValidation,
  validate,
  billController.exportPdf,
);

router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("invoices"),
  billIdParamValidation,
  validate,
  billController.getById,
);
router.patch(
  "/:id/additional-charges",
  authenticate,
  requireRole("ADMIN"),
  updateAdditionalChargesValidation,
  validate,
  billController.updateAdditionalCharges,
);
router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("ADMIN"),
  billIdParamValidation,
  validate,
  billController.cancel,
);
router.post(
  "/:id/mark-printed",
  authenticate,
  requireRole("ADMIN"),
  billIdParamValidation,
  validate,
  billController.markPrinted,
);

router.get(
  "/:id/invoice-pdf",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("invoices"),
  billIdParamValidation,
  validate,
  billController.downloadInvoicePdf,
);

router.post(
  "/:id/payments",
  authenticate,
  requireRole("ADMIN"),
  addPaymentValidation,
  validate,
  billController.addPayment,
);
router.get(
  "/:id/payments",
  authenticate,
  requireRole("ADMIN"),
  billIdParamValidation,
  validate,
  billController.listPayments,
);

router.post(
  "/:id/send",
  authenticate,
  requireRole("ADMIN"),
  sendInvoiceValidation,
  validate,
  billController.sendInvoice,
);
router.get(
  "/:id/send-history",
  authenticate,
  requireRole("ADMIN"),
  billIdParamValidation,
  validate,
  billController.listSendHistory,
);

export { router as billRouter };
