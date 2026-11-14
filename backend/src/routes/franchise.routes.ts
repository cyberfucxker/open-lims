import { Router } from "express";
import * as franchiseController from "../controllers/franchise.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireFranchise } from "../middleware/franchise.middleware";
import { uploadLabLogo } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  addOrderHomeVisitItemsValidation,
  assignOrderPhleboValidation,
  createAreaRequestValidation,
  createOrderValidation,
  createOwnPhlebotomistValidation,
  dashboardValidation,
  listOrdersValidation,
  listReportsValidation,
  notificationIdParamValidation,
  orderIdParamValidation,
  removeOrderHomeVisitItemValidation,
  setOwnPhlebotomistStatusValidation,
  setPriceListItemsValidation,
  updateOrderStatusValidation,
  updateProfileValidation,
} from "../validations/franchise.validation";

/**
 * The franchise portal's API surface.
 *
 * These are separate routes rather than the admin routes with a loosened
 * `requireRole`. Loosening (say) `/app-orders` to accept FRANCHISE would mean
 * every handler on that router has to remember to scope its query, and one
 * forgotten handler leaks every franchise's data. Here the scope is applied by
 * `requireFranchise` and read from `req.franchise` — a handler cannot forget it
 * because there is no unscoped path through the controller.
 */
const router = Router();

router.use(authenticate, requireFranchise);

// Profile
router.get("/me", franchiseController.getMe);
router.patch("/me", updateProfileValidation, validate, franchiseController.updateMe);
router.post("/me/logo", uploadLabLogo, franchiseController.uploadLabLogo);

// Dashboard
router.get("/dashboard", dashboardValidation, validate, franchiseController.getDashboard);

// Orders — full Order Management parity except delete; every handler is
// scoped to this franchise's own visible orders server-side.
router.get("/orders", listOrdersValidation, validate, franchiseController.listOrders);
router.post("/orders", createOrderValidation, validate, franchiseController.createOrder);
router.get("/orders/:id", orderIdParamValidation, validate, franchiseController.getOrder);
router.patch(
  "/orders/:id/status",
  updateOrderStatusValidation,
  validate,
  franchiseController.updateOrderStatus,
);
router.patch(
  "/orders/:id/assign-phlebo",
  assignOrderPhleboValidation,
  validate,
  franchiseController.assignOrderPhlebo,
);
router.post(
  "/orders/:id/home-visit-items",
  addOrderHomeVisitItemsValidation,
  validate,
  franchiseController.addOrderHomeVisitItems,
);
router.delete(
  "/orders/:id/home-visit-items/:itemId",
  removeOrderHomeVisitItemValidation,
  validate,
  franchiseController.removeOrderHomeVisitItem,
);

// Reports
router.get("/reports", listReportsValidation, validate, franchiseController.listReports);

// Price list — read and write the franchise's own clone only.
router.get("/price-list", franchiseController.getPriceList);
router.put(
  "/price-list/items",
  setPriceListItemsValidation,
  validate,
  franchiseController.setPriceListItems,
);

// Service areas — read-only; an admin assigns these from Superadmin.
router.get("/service-areas", franchiseController.getServiceAreas);

// Phlebotomists — a franchise's own only, scoped to its own assigned areas.
router.get("/phlebos", franchiseController.listPhlebotomists);
router.post(
  "/phlebos",
  createOwnPhlebotomistValidation,
  validate,
  franchiseController.createPhlebotomist,
);
router.patch(
  "/phlebos/:id/status",
  setOwnPhlebotomistStatusValidation,
  validate,
  franchiseController.setPhlebotomistStatus,
);

// Area requests — propose new coverage in this franchise's own city.
router.get("/area-requests", franchiseController.listAreaRequests);
router.post(
  "/area-requests",
  createAreaRequestValidation,
  validate,
  franchiseController.createAreaRequest,
);

// Notifications — this franchise's own in-app feed.
router.get("/notifications", franchiseController.listNotifications);
router.patch("/notifications/read-all", franchiseController.markAllNotificationsRead);
router.patch(
  "/notifications/:id/read",
  notificationIdParamValidation,
  validate,
  franchiseController.markNotificationRead,
);

export { router as franchiseRouter };
