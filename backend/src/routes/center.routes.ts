import { Router } from "express";
import * as centerController from "../controllers/center.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  centerIdParamValidation,
  createCenterValidation,
  listCentersValidation,
  setCenterStatusValidation,
  updateCenterValidation,
} from "../validations/center.validation";

const router = Router();

// Each route declares its own requireRole call (rather than one blanket
// router.use) so read-only access for another role is a one-line change
// later without touching the write routes — same convention as department.routes.ts.
router.get("/active", authenticate, requireRole("ADMIN"), centerController.listActive);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listCentersValidation,
  validate,
  centerController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  centerIdParamValidation,
  validate,
  centerController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createCenterValidation,
  validate,
  centerController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateCenterValidation,
  validate,
  centerController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  centerIdParamValidation,
  validate,
  centerController.remove,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setCenterStatusValidation,
  validate,
  centerController.setStatus,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  centerIdParamValidation,
  validate,
  centerController.restore,
);

export { router as centerRouter };
