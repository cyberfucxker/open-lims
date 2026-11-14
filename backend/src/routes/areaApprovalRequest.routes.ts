import { Router } from "express";
import * as areaApprovalRequestController from "../controllers/areaApprovalRequest.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  areaApprovalRequestIdParamValidation,
  listAreaApprovalRequestsValidation,
  rejectAreaApprovalRequestValidation,
} from "../validations/areaApproval.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listAreaApprovalRequestsValidation, validate, areaApprovalRequestController.list);
router.patch(
  "/:id/approve",
  areaApprovalRequestIdParamValidation,
  validate,
  areaApprovalRequestController.approve,
);
router.patch(
  "/:id/reject",
  rejectAreaApprovalRequestValidation,
  validate,
  areaApprovalRequestController.reject,
);

export { router as areaApprovalRequestRouter };
