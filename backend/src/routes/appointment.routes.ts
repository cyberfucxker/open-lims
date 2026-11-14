import { Router } from "express";
import * as appointmentController from "../controllers/appointment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  appointmentIdParamValidation,
  listAppointmentsValidation,
  updateAppointmentStatusValidation,
} from "../validations/appointment.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Appointment History (global) — filterable by patient/status/date, paginated.
router.get("/", listAppointmentsValidation, validate, appointmentController.list);

router.get("/:id", appointmentIdParamValidation, validate, appointmentController.getById);
router.patch(
  "/:id/status",
  updateAppointmentStatusValidation,
  validate,
  appointmentController.updateStatus,
);

export { router as appointmentRouter };
