import { Router } from "express";
import { query } from "express-validator";
import * as liveCapacityController from "../controllers/liveCapacity.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get(
  "/",
  [
    query("cityId").isUUID().withMessage("Invalid city id"),
    query("date").isISO8601().withMessage("Invalid date"),
  ],
  validate,
  liveCapacityController.get,
);

export { router as liveCapacityRouter };
