import { Router } from "express";
import * as holidayController from "../controllers/holiday.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createHolidayValidation,
  holidayIdParamValidation,
  listHolidaysValidation,
} from "../validations/holiday.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listHolidaysValidation, validate, holidayController.list);
router.post("/", createHolidayValidation, validate, holidayController.create);
router.delete("/:id", holidayIdParamValidation, validate, holidayController.remove);

export { router as holidayRouter };
