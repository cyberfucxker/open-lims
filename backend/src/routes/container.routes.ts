import { Router } from "express";
import * as containerController from "../controllers/container.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  containerIdParamValidation,
  createContainerValidation,
  listContainersValidation,
  setContainerStatusValidation,
  updateContainerValidation,
} from "../validations/container.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listContainersValidation,
  validate,
  containerController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  containerIdParamValidation,
  validate,
  containerController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createContainerValidation,
  validate,
  containerController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateContainerValidation,
  validate,
  containerController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  containerIdParamValidation,
  validate,
  containerController.remove,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setContainerStatusValidation,
  validate,
  containerController.setStatus,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  containerIdParamValidation,
  validate,
  containerController.restore,
);

export { router as containerRouter };
