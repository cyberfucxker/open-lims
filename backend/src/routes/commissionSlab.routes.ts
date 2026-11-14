import { Router } from "express";
import * as commissionSlabController from "../controllers/commissionSlab.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  commissionSlabIdParamValidation,
  createCommissionSlabValidation,
  setCommissionSlabStatusValidation,
  updateCommissionSlabValidation,
} from "../validations/commissionSlab.validation";

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), commissionSlabController.list);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createCommissionSlabValidation,
  validate,
  commissionSlabController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateCommissionSlabValidation,
  validate,
  commissionSlabController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  commissionSlabIdParamValidation,
  validate,
  commissionSlabController.remove,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setCommissionSlabStatusValidation,
  validate,
  commissionSlabController.setStatus,
);

export { router as commissionSlabRouter };
