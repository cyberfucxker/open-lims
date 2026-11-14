import { Router } from "express";
import * as couponController from "../controllers/coupon.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  couponIdParamValidation,
  createCouponValidation,
  listCouponsValidation,
  reorderHomeCouponsValidation,
  setCouponHomeFeatureValidation,
  setCouponStatusValidation,
  updateCouponValidation,
} from "../validations/coupon.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal path before "/:id" — same convention as phlebotomist.routes.ts.
router.patch("/reorder-home", reorderHomeCouponsValidation, validate, couponController.reorderHome);

router.get("/", listCouponsValidation, validate, couponController.list);
router.get("/:id", couponIdParamValidation, validate, couponController.getById);
router.post("/", createCouponValidation, validate, couponController.create);
router.put("/:id", updateCouponValidation, validate, couponController.update);
router.patch("/:id/status", setCouponStatusValidation, validate, couponController.setStatus);
router.patch(
  "/:id/home",
  setCouponHomeFeatureValidation,
  validate,
  couponController.setHomeFeature,
);
router.delete("/:id", couponIdParamValidation, validate, couponController.remove);

export { router as couponRouter };
