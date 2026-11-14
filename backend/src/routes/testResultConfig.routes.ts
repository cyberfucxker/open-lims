import { Router } from "express";
import * as testResultConfigController from "../controllers/testResultConfig.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listTestResultConfigsValidation,
  testIdParamValidation,
  upsertTestResultConfigValidation,
} from "../validations/testResultConfig.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listTestResultConfigsValidation, validate, testResultConfigController.list);
router.get("/:testId", testIdParamValidation, validate, testResultConfigController.getByTestId);
router.put(
  "/:testId",
  upsertTestResultConfigValidation,
  validate,
  testResultConfigController.upsert,
);

export { router as testResultConfigRouter };
