import { Router } from "express";
import * as paymentGatewayConfigController from "../controllers/paymentGatewayConfig.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { updatePaymentGatewayConfigValidation } from "../validations/paymentGatewayConfig.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", paymentGatewayConfigController.get);
router.put(
  "/",
  updatePaymentGatewayConfigValidation,
  validate,
  paymentGatewayConfigController.update,
);

export { router as paymentGatewayConfigRouter };
