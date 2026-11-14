import { Router } from "express";
import * as slotAvailabilitySettingsController from "../controllers/slotAvailabilitySettings.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateSlotAvailabilitySettingsValidation } from "../validations/slotAvailabilitySettings.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", slotAvailabilitySettingsController.getSettings);
router.patch(
  "/",
  updateSlotAvailabilitySettingsValidation,
  validate,
  slotAvailabilitySettingsController.updateSettings,
);

export { router as slotAvailabilitySettingsRouter };
