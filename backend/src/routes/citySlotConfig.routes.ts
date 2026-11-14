import { Router } from "express";
import * as citySlotConfigController from "../controllers/citySlotConfig.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  assignCitySlotTemplatesValidation,
  getCitySlotConfigValidation,
  setCityCutoverValidation,
  setCityParentOrganizationValidation,
  setCityPhlebotomyChargeValidation,
} from "../validations/citySlotConfig.validation";
import { managerReadAccess } from "../middleware/staffModule.middleware";

const router = Router();

// City picker in the Phlebos module's form — see `managerReadAccess`.
router.get(
  "/cities",
  authenticate,
  managerReadAccess("phlebos"),
  citySlotConfigController.listCities,
);

router.use(authenticate, requireRole("ADMIN"));

router.get("/cities", citySlotConfigController.listCities);
router.get("/", getCitySlotConfigValidation, validate, citySlotConfigController.getConfig);
router.post("/", assignCitySlotTemplatesValidation, validate, citySlotConfigController.assign);
router.patch(
  "/:cityId/cutover",
  setCityCutoverValidation,
  validate,
  citySlotConfigController.setCutover,
);
router.patch(
  "/:cityId/phlebotomy-charge",
  setCityPhlebotomyChargeValidation,
  validate,
  citySlotConfigController.setPhlebotomyCharge,
);
router.patch(
  "/:cityId/parent-organization",
  setCityParentOrganizationValidation,
  validate,
  citySlotConfigController.setParentOrganization,
);

export { router as citySlotConfigRouter };
