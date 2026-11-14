import { Router } from "express";
import * as reportSettingsController from "../controllers/reportSettings.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { uploadReportAsset } from "../middleware/upload.middleware";
import {
  assetTypeParamValidation,
  previewReportSettingsValidation,
  updateReportSettingsValidation,
} from "../validations/reportSettings.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", reportSettingsController.get);
router.put("/", updateReportSettingsValidation, validate, reportSettingsController.update);
router.post("/restore-default", reportSettingsController.restoreDefault);
router.post(
  "/preview",
  previewReportSettingsValidation,
  validate,
  reportSettingsController.preview,
);
router.post(
  "/assets/:assetType",
  assetTypeParamValidation,
  validate,
  uploadReportAsset,
  reportSettingsController.uploadAsset,
);

export { router as reportSettingsRouter };
