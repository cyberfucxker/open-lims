import { Router } from "express";
import * as dashboardSummaryController from "../controllers/dashboardSummary.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", dashboardSummaryController.get);

export { router as dashboardSummaryRouter };
