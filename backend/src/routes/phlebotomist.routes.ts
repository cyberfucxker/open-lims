import { Router } from "express";
import * as phlebotomistController from "../controllers/phlebotomist.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createPhlebotomistValidation,
  listPhlebotomistsValidation,
  phlebotomistIdParamValidation,
  setPhlebotomistStatusValidation,
  updatePhlebotomistValidation,
} from "../validations/phlebotomist.validation";
import { requireStaffModule } from "../middleware/staffModule.middleware";

const router = Router();

router.use(authenticate);

// Literal path before "/:id" — same convention as organization.routes.ts.
// Also the Orders page's "assign phlebo" dropdown, hence the orders module.
router.get("/active", requireStaffModule("phlebos", "orders"), phlebotomistController.listActive);

// ADMIN, or a MANAGER granted the "phlebos" module. Deleting stays ADMIN-only.
router.use(requireStaffModule("phlebos"));

router.get("/", listPhlebotomistsValidation, validate, phlebotomistController.list);
router.get("/:id", phlebotomistIdParamValidation, validate, phlebotomistController.getById);
router.get("/:id/stats", phlebotomistIdParamValidation, validate, phlebotomistController.getStats);
router.post("/", createPhlebotomistValidation, validate, phlebotomistController.create);
router.put("/:id", updatePhlebotomistValidation, validate, phlebotomistController.update);
router.patch(
  "/:id/status",
  setPhlebotomistStatusValidation,
  validate,
  phlebotomistController.setStatus,
);
router.delete(
  "/:id",
  requireRole("ADMIN"),
  phlebotomistIdParamValidation,
  validate,
  phlebotomistController.remove,
);

export { router as phlebotomistRouter };
