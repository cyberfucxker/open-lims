import { Router } from "express";
import * as appOrderController from "../controllers/appOrder.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  addHomeVisitItemsValidation,
  appOrderIdParamValidation,
  assignPhleboValidation,
  createAppOrderValidation,
  listAppOrdersValidation,
  removeHomeVisitItemValidation,
  updateAppOrderStatusValidation,
} from "../validations/appOrder.validation";
import { requireStaffModule } from "../middleware/staffModule.middleware";

const router = Router();

// ADMIN, or a MANAGER granted the "orders" module. Deleting an order stays
// ADMIN-only.
router.use(authenticate, requireStaffModule("orders"));

router.get("/", listAppOrdersValidation, validate, appOrderController.list);
router.get("/:id", appOrderIdParamValidation, validate, appOrderController.getById);
router.post("/", createAppOrderValidation, validate, appOrderController.create);
router.patch(
  "/:id/status",
  updateAppOrderStatusValidation,
  validate,
  appOrderController.updateStatus,
);
router.patch(
  "/:id/assign-phlebo",
  assignPhleboValidation,
  validate,
  appOrderController.assignPhlebo,
);
router.delete(
  "/:id",
  requireRole("ADMIN"),
  appOrderIdParamValidation,
  validate,
  appOrderController.remove,
);
// Local fallback while the Phlebo App has no "add tests" screen of its own —
// see the controller's doc-comment.
router.post(
  "/:id/home-visit-items",
  addHomeVisitItemsValidation,
  validate,
  appOrderController.addHomeVisitItems,
);
router.delete(
  "/:id/home-visit-items/:itemId",
  removeHomeVisitItemValidation,
  validate,
  appOrderController.removeHomeVisitItem,
);

export { router as appOrderRouter };
