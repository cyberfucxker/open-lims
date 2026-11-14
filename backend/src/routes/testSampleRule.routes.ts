import { Router } from "express";
import * as testSampleRuleController from "../controllers/testSampleRule.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listTestSampleRulesValidation,
  testIdParamValidation,
  upsertTestSampleRuleValidation,
} from "../validations/testSampleRule.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listTestSampleRulesValidation, validate, testSampleRuleController.list);
router.get("/:testId", testIdParamValidation, validate, testSampleRuleController.getByTestId);
router.put("/:testId", upsertTestSampleRuleValidation, validate, testSampleRuleController.upsert);

export { router as testSampleRuleRouter };
