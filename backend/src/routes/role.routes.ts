import { Router } from "express";
import * as roleController from "../controllers/role.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Only surfaced today for the Organization "Role Assignment" picker, so
// ADMIN-only like every other write-side/admin screen.
router.get("/", authenticate, requireRole("ADMIN"), roleController.list);

export { router as roleRouter };
