import { Router } from "express";
import * as areaSlotBlockController from "../controllers/areaSlotBlock.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  areaSlotBlockIdParamValidation,
  bulkCreateAreaSlotBlockValidation,
  bulkDeleteAreaSlotBlockValidation,
  createAreaSlotBlockValidation,
  listAreaSlotBlocksValidation,
} from "../validations/areaSlotBlock.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal paths before "/:id" — same convention as phlebotomist.routes.ts.
router.post(
  "/bulk",
  bulkCreateAreaSlotBlockValidation,
  validate,
  areaSlotBlockController.createBulk,
);
router.post(
  "/bulk-delete",
  bulkDeleteAreaSlotBlockValidation,
  validate,
  areaSlotBlockController.removeBulk,
);

router.get("/", listAreaSlotBlocksValidation, validate, areaSlotBlockController.list);
router.post("/", createAreaSlotBlockValidation, validate, areaSlotBlockController.create);
router.delete("/:id", areaSlotBlockIdParamValidation, validate, areaSlotBlockController.remove);

export { router as areaSlotBlockRouter };
