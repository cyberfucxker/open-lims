import { Router } from "express";
import * as expenseController from "../controllers/expense.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createExpenseCategoryValidation,
  createExpenseServiceValidation,
  createExpenseValidation,
  listExpensesValidation,
} from "../validations/expense.validation";

const router = Router();

// Literal-path routes must be declared before any "/:id" route is added, or
// Express would match them as an :id — same convention as bill.routes.ts.
router.get("/categories", authenticate, requireRole("ADMIN"), expenseController.listCategories);
router.post(
  "/categories",
  authenticate,
  requireRole("ADMIN"),
  createExpenseCategoryValidation,
  validate,
  expenseController.createCategory,
);
router.get("/services", authenticate, requireRole("ADMIN"), expenseController.listServices);
router.post(
  "/services",
  authenticate,
  requireRole("ADMIN"),
  createExpenseServiceValidation,
  validate,
  expenseController.createService,
);

router.get(
  "/export/excel",
  authenticate,
  requireRole("ADMIN"),
  listExpensesValidation,
  validate,
  expenseController.exportExcel,
);
router.get(
  "/export/pdf",
  authenticate,
  requireRole("ADMIN"),
  listExpensesValidation,
  validate,
  expenseController.exportPdf,
);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listExpensesValidation,
  validate,
  expenseController.list,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createExpenseValidation,
  validate,
  expenseController.create,
);

export { router as expenseRouter };
