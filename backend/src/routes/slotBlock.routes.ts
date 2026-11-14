import { Router } from "express";
import * as slotBlockController from "../controllers/slotBlock.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  bulkCreateSlotBlockValidation,
  bulkDeleteSlotBlockValidation,
  createSlotBlockValidation,
  listSlotBlocksValidation,
  slotBlockIdParamValidation,
} from "../validations/slotBlock.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal paths before "/:id" — same convention as phlebotomist.routes.ts.
router.post("/bulk", bulkCreateSlotBlockValidation, validate, slotBlockController.createBulk);
router.post(
  "/bulk-delete",
  bulkDeleteSlotBlockValidation,
  validate,
  slotBlockController.removeBulk,
);

router.get("/", listSlotBlocksValidation, validate, slotBlockController.list);
router.post("/", createSlotBlockValidation, validate, slotBlockController.create);
router.delete("/:id", slotBlockIdParamValidation, validate, slotBlockController.remove);

export { router as slotBlockRouter };
