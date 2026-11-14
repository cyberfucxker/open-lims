import { Router } from "express";
import * as homeFaqController from "../controllers/homeFaq.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createHomeFaqValidation,
  homeFaqIdParamValidation,
  listHomeFaqsValidation,
  reorderHomeFaqsValidation,
  setHomeFaqStatusValidation,
  updateHomeFaqValidation,
} from "../validations/homeFaq.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal paths before "/:id" — same convention as banner.routes.ts.
router.patch("/reorder", reorderHomeFaqsValidation, validate, homeFaqController.reorder);

router.get("/", listHomeFaqsValidation, validate, homeFaqController.list);
router.get("/:id", homeFaqIdParamValidation, validate, homeFaqController.getById);
router.post("/", createHomeFaqValidation, validate, homeFaqController.create);
router.put("/:id", updateHomeFaqValidation, validate, homeFaqController.update);
router.patch("/:id/status", setHomeFaqStatusValidation, validate, homeFaqController.setStatus);
router.delete("/:id", homeFaqIdParamValidation, validate, homeFaqController.remove);

export { router as homeFaqRouter };
