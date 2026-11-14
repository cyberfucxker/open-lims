import { Router } from "express";
import * as referralIncentiveController from "../controllers/referralIncentive.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listReferralIncentivesValidation,
  monthlyIncentiveValidation,
  referralSourceIdParamValidation,
} from "../validations/referralIncentive.validation";

const router = Router();

// Literal-path routes must be declared before "/by-referral/:referralSourceId".
router.get(
  "/monthly",
  authenticate,
  requireRole("ADMIN"),
  monthlyIncentiveValidation,
  validate,
  referralIncentiveController.monthlySummary,
);
router.get(
  "/by-referral/:referralSourceId",
  authenticate,
  requireRole("ADMIN"),
  referralSourceIdParamValidation,
  validate,
  referralIncentiveController.listByReferralSource,
);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listReferralIncentivesValidation,
  validate,
  referralIncentiveController.list,
);

export { router as referralIncentiveRouter };
