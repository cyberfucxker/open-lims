import { Router } from "express";
import * as areaController from "../controllers/area.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  areaIdParamValidation,
  createAreaValidation,
  listAreasValidation,
  setAreaPhlebotomyChargeValidation,
  setAreaStatusValidation,
  updateAreaValidation,
} from "../validations/area.validation";
import { managerReadAccess } from "../middleware/staffModule.middleware";

const router = Router();

// Area picker in the Phlebos module's form — see `managerReadAccess`.
router.get(
  "/",
  authenticate,
  managerReadAccess("phlebos"),
  listAreasValidation,
  validate,
  areaController.list,
);

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listAreasValidation, validate, areaController.list);
router.get("/:id", areaIdParamValidation, validate, areaController.getById);
router.post("/", createAreaValidation, validate, areaController.create);
router.put("/:id", updateAreaValidation, validate, areaController.update);
router.patch("/:id/status", setAreaStatusValidation, validate, areaController.setStatus);
router.patch(
  "/:id/phlebotomy-charge",
  setAreaPhlebotomyChargeValidation,
  validate,
  areaController.setPhlebotomyCharge,
);
router.delete("/:id", areaIdParamValidation, validate, areaController.remove);

export { router as areaRouter };
