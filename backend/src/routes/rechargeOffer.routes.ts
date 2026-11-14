import { Router } from "express";
import * as rechargeOfferController from "../controllers/rechargeOffer.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createRechargeOfferValidation,
  listRechargeOffersValidation,
  rechargeOfferIdParamValidation,
  setRechargeOfferStatusValidation,
  updateRechargeOfferValidation,
} from "../validations/rechargeOffer.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listRechargeOffersValidation, validate, rechargeOfferController.list);
router.get("/:id", rechargeOfferIdParamValidation, validate, rechargeOfferController.getById);
router.post("/", createRechargeOfferValidation, validate, rechargeOfferController.create);
router.put("/:id", updateRechargeOfferValidation, validate, rechargeOfferController.update);
router.patch(
  "/:id/status",
  setRechargeOfferStatusValidation,
  validate,
  rechargeOfferController.setStatus,
);
router.delete("/:id", rechargeOfferIdParamValidation, validate, rechargeOfferController.remove);

export { router as rechargeOfferRouter };
