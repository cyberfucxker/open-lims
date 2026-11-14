import { Router } from "express";
import * as slotDashboardStatsController from "../controllers/slotDashboardStats.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", slotDashboardStatsController.get);

export { router as slotDashboardStatsRouter };
