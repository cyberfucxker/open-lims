import { Router } from "express";
import * as doctorVisitController from "../controllers/doctorVisit.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createDoctorVisitValidation,
  listDoctorVisitsValidation,
  listUpcomingVisitsValidation,
} from "../validations/doctorVisit.validation";

const router = Router();

// "/upcoming" must be declared before any future "/:id" route.
router.get(
  "/upcoming",
  authenticate,
  requireRole("ADMIN"),
  listUpcomingVisitsValidation,
  validate,
  doctorVisitController.listUpcoming,
);

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  listDoctorVisitsValidation,
  validate,
  doctorVisitController.list,
);
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createDoctorVisitValidation,
  validate,
  doctorVisitController.create,
);

export { router as doctorVisitRouter };
