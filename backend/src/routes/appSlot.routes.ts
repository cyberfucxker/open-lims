import { Router } from "express";
import * as appSlotController from "../controllers/appSlot.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  appSlotIdParamValidation,
  bulkApplySlotsValidation,
  createAppSlotValidation,
  listAppSlotsValidation,
  setAppSlotBlockedValidation,
  updateAppSlotValidation,
} from "../validations/appSlot.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal-path route ("/bulk-apply") must be declared before "/:id" routes
// below, or Express would match "bulk-apply" as an :id.
router.post("/bulk-apply", bulkApplySlotsValidation, validate, appSlotController.bulkApply);

router.get("/", listAppSlotsValidation, validate, appSlotController.list);
router.post("/", createAppSlotValidation, validate, appSlotController.create);
router.put("/:id", updateAppSlotValidation, validate, appSlotController.update);
router.patch("/:id/block", setAppSlotBlockedValidation, validate, appSlotController.setBlocked);
router.delete("/:id", appSlotIdParamValidation, validate, appSlotController.remove);

export { router as appSlotRouter };
