import { Router } from "express";
import * as cityController from "../controllers/city.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  cityIdParamValidation,
  createCityValidation,
  listCitiesValidation,
  setCityStatusValidation,
  updateCityValidation,
} from "../validations/city.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listCitiesValidation,
  validate,
  cityController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  cityIdParamValidation,
  validate,
  cityController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createCityValidation,
  validate,
  cityController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateCityValidation,
  validate,
  cityController.update,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setCityStatusValidation,
  validate,
  cityController.setStatus,
);

export { router as cityRouter };
