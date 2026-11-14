import { Router } from "express";
import * as priceListController from "../controllers/priceList.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createPriceListValidation,
  listPriceListsValidation,
  priceListIdParamValidation,
  setPriceListItemsValidation,
  setPriceListPricingValidation,
  setPriceListStatusValidation,
  updatePriceListValidation,
} from "../validations/priceList.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listPriceListsValidation,
  validate,
  priceListController.list,
);
router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  priceListIdParamValidation,
  validate,
  priceListController.getById,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createPriceListValidation,
  validate,
  priceListController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updatePriceListValidation,
  validate,
  priceListController.update,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  priceListIdParamValidation,
  validate,
  priceListController.remove,
);
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  priceListIdParamValidation,
  validate,
  priceListController.restore,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setPriceListStatusValidation,
  validate,
  priceListController.setStatus,
);
router.get(
  "/:id/items",
  authenticate,
  requireRole("ADMIN"),
  priceListIdParamValidation,
  validate,
  priceListController.listItems,
);
router.put(
  "/:id/items",
  authenticate,
  requireRole("ADMIN"),
  setPriceListItemsValidation,
  validate,
  priceListController.setItems,
);

// Full-catalogue pricing (TEST+PACKAGE+PARAMETER together) — the admin price
// editor page. Kept as separate routes rather than changing `/:id/items`
// above, so the older TEST-only sheet keeps working unchanged.
router.get(
  "/:id/pricing",
  authenticate,
  requireRole("ADMIN"),
  priceListIdParamValidation,
  validate,
  priceListController.getItemsView,
);
router.put(
  "/:id/pricing",
  authenticate,
  requireRole("ADMIN"),
  setPriceListPricingValidation,
  validate,
  priceListController.setItemsView,
);

export { router as priceListRouter };
