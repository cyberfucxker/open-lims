import { Router } from "express";
import * as serviceCenterController from "../controllers/serviceCenter.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createServiceCenterValidation,
  listServiceCentersValidation,
  serviceCenterIdParamValidation,
  setServiceCenterStatusValidation,
  updateServiceCenterValidation,
} from "../validations/serviceCenter.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal path before "/:id" — same convention as phlebotomist.routes.ts.
router.get("/options", serviceCenterController.options);

router.get("/", listServiceCentersValidation, validate, serviceCenterController.list);
router.get("/:id", serviceCenterIdParamValidation, validate, serviceCenterController.getById);
router.post("/", createServiceCenterValidation, validate, serviceCenterController.create);
router.put("/:id", updateServiceCenterValidation, validate, serviceCenterController.update);
router.patch(
  "/:id/status",
  setServiceCenterStatusValidation,
  validate,
  serviceCenterController.setStatus,
);
router.delete("/:id", serviceCenterIdParamValidation, validate, serviceCenterController.remove);

export { router as serviceCenterRouter };
