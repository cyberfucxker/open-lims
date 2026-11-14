import { Router } from "express";
import * as slotTemplateController from "../controllers/slotTemplate.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createSlotTemplateValidation,
  listSlotTemplatesValidation,
  setSlotTemplateActiveValidation,
  slotTemplateIdParamValidation,
  updateSlotTemplateValidation,
} from "../validations/slotTemplate.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal path before "/:id" — same convention as phlebotomist.routes.ts.
router.get("/active", slotTemplateController.listActive);

router.get("/", listSlotTemplatesValidation, validate, slotTemplateController.list);
router.get("/:id", slotTemplateIdParamValidation, validate, slotTemplateController.getById);
router.post("/", createSlotTemplateValidation, validate, slotTemplateController.create);
router.put("/:id", updateSlotTemplateValidation, validate, slotTemplateController.update);
router.patch(
  "/:id/status",
  setSlotTemplateActiveValidation,
  validate,
  slotTemplateController.setActive,
);
router.delete("/:id", slotTemplateIdParamValidation, validate, slotTemplateController.remove);

export { router as slotTemplateRouter };
