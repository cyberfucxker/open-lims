import { Router } from "express";
import * as globalSearchController from "../controllers/globalSearch.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireModuleAccess } from "../middleware/moduleAccess.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Backs the Topbar's global search palette — fans a single query out to the
// Patient and Test catalogues, gated the same as those modules themselves.
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  globalSearchController.search,
);

export { router as globalSearchRouter };
