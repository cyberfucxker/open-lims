import { Router } from "express";
import * as sampleTypeBarcodeConfigController from "../controllers/sampleTypeBarcodeConfig.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listSampleTypeBarcodeConfigsValidation,
  sampleTypeIdParamValidation,
  upsertSampleTypeBarcodeConfigValidation,
} from "../validations/sampleTypeBarcodeConfig.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get(
  "/",
  listSampleTypeBarcodeConfigsValidation,
  validate,
  sampleTypeBarcodeConfigController.list,
);
router.get(
  "/:sampleTypeId",
  sampleTypeIdParamValidation,
  validate,
  sampleTypeBarcodeConfigController.getBySampleTypeId,
);
router.put(
  "/:sampleTypeId",
  upsertSampleTypeBarcodeConfigValidation,
  validate,
  sampleTypeBarcodeConfigController.upsert,
);

export { router as sampleTypeBarcodeConfigRouter };
