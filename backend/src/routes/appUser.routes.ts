import { Router } from "express";
import * as appUserController from "../controllers/appUser.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  adjustWalletValidation,
  appUserIdParamValidation,
  listAppUsersValidation,
  setAppUserStatusValidation,
  updateAppUserValidation,
} from "../validations/appUser.validation";
import { managerReadAccess } from "../middleware/staffModule.middleware";

const router = Router();

// Customer lookup for the Orders module's "create order" dialog — see
// `managerReadAccess`. Everything else on this router stays ADMIN-only.
router.get(
  "/",
  authenticate,
  managerReadAccess("orders"),
  listAppUsersValidation,
  validate,
  appUserController.list,
);
router.get(
  "/:id",
  authenticate,
  managerReadAccess("orders"),
  appUserIdParamValidation,
  validate,
  appUserController.getById,
);

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listAppUsersValidation, validate, appUserController.list);
// Registered before `/:id` — otherwise `:id` would swallow the literal "wallet-stats" segment.
router.get("/wallet-stats", appUserController.getWalletStats);
router.get("/:id", appUserIdParamValidation, validate, appUserController.getById);
router.put("/:id", updateAppUserValidation, validate, appUserController.update);
router.patch("/:id/status", setAppUserStatusValidation, validate, appUserController.setStatus);
router.post("/:id/wallet/adjust", adjustWalletValidation, validate, appUserController.adjustWallet);

export { router as appUserRouter };
