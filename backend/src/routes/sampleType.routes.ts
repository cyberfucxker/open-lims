import { Router } from "express";
import * as sampleTypeController from "../controllers/sampleType.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createSampleTypeValidation,
  listSampleTypesValidation,
  sampleTypeIdParamValidation,
  setSampleTypeStatusValidation,
  updateSampleTypeValidation,
} from "../validations/sampleType.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listSampleTypesValidation,
  validate,
  sampleTypeController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  sampleTypeIdParamValidation,
  validate,
  sampleTypeController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createSampleTypeValidation,
  validate,
  sampleTypeController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateSampleTypeValidation,
  validate,
  sampleTypeController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  sampleTypeIdParamValidation,
  validate,
  sampleTypeController.remove,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setSampleTypeStatusValidation,
  validate,
  sampleTypeController.setStatus,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  sampleTypeIdParamValidation,
  validate,
  sampleTypeController.restore,
);

export { router as sampleTypeRouter };
