import { Router } from "express";
import * as patientController from "../controllers/patient.controller";
import * as appointmentController from "../controllers/appointment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireModuleAccess } from "../middleware/moduleAccess.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listPatientsValidation,
  patientIdParamValidation,
  registerPatientValidation,
  updatePatientValidation,
} from "../validations/patient.validation";
import {
  createAppointmentForPatientValidation,
  listPatientAppointmentsValidation,
} from "../validations/appointment.validation";

const router = Router();

// Every route below still requires authentication; most also require ADMIN.
// The Registration / Search / View / Barcode / Appointment-History /
// New-Visit routes additionally allow a FRANCHISE (Collection Center portal)
// caller gated by requireModuleAccess("patients") — patient.service.ts and
// appointment.service.ts scope every one of those to the caller's own
// Organization, so a portal user only ever sees/creates their own data.
// Declared per-route (not one blanket router.use) so that scoping is visible
// at a glance here, matching the convention already used by the masters
// modules (see department.routes.ts).

// New Registration — creates the Patient and its first Appointment together.
router.post(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  registerPatientValidation,
  validate,
  patientController.register,
);

// Patient Search — Patient ID / Optional Patient ID / Name / Mobile / Email /
// Organization / Referral + advanced filters, pagination and sorting.
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  listPatientsValidation,
  validate,
  patientController.list,
);

router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  patientIdParamValidation,
  validate,
  patientController.getById,
);

// Edit isn't a Collection Center feature — ADMIN only.
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  updatePatientValidation,
  validate,
  patientController.update,
);

router.get(
  "/:id/barcode",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  patientIdParamValidation,
  validate,
  patientController.getBarcode,
);

// Patient History — this patient's full appointment list.
router.get(
  "/:id/appointments",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  listPatientAppointmentsValidation,
  validate,
  appointmentController.listForPatient,
);

// Already Registered — a new visit for an existing patient; never creates
// another Patient row.
router.post(
  "/:id/appointments",
  authenticate,
  requireRole("ADMIN", "FRANCHISE"),
  requireModuleAccess("patients"),
  createAppointmentForPatientValidation,
  validate,
  appointmentController.createForPatient,
);

export { router as patientRouter };
