import { Router } from "express";
import * as homeSeoContentController from "../controllers/homeSeoContent.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateHomeSeoContentValidation } from "../validations/homeSeoContent.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", homeSeoContentController.get);
router.put("/", updateHomeSeoContentValidation, validate, homeSeoContentController.update);

export { router as homeSeoContentRouter };
