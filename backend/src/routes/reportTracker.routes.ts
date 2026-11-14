import { Router } from "express";
import * as reportTrackerController from "../controllers/reportTracker.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { listReportTrackerValidation } from "../validations/reportTracker.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listReportTrackerValidation, validate, reportTrackerController.list);

export { router as reportTrackerRouter };
