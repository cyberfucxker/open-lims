import { Router } from "express";
import * as stateController from "../controllers/state.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createStateValidation,
  stateIdParamValidation,
  updateStateValidation,
} from "../validations/state.validation";

const router = Router();

// No pagination — the whole list (India's states) is what the City form's
// picker and the States tab both need every time.
router.get("/", authenticate, requireRole("ADMIN"), stateController.list);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createStateValidation,
  validate,
  stateController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updateStateValidation,
  validate,
  stateController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  stateIdParamValidation,
  validate,
  stateController.remove,
);

export { router as stateRouter };
