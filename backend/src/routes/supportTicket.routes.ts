import { Router } from "express";
import * as supportTicketController from "../controllers/supportTicket.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listSupportTicketsValidation,
  setSupportTicketStatusValidation,
  supportTicketIdParamValidation,
} from "../validations/supportTicket.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listSupportTicketsValidation, validate, supportTicketController.list);
router.get("/:id", supportTicketIdParamValidation, validate, supportTicketController.getById);
router.patch(
  "/:id/status",
  setSupportTicketStatusValidation,
  validate,
  supportTicketController.setStatus,
);

export { router as supportTicketRouter };
