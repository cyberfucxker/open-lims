import { Router } from "express";
import * as signatoryController from "../controllers/signatory.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { uploadReportAsset } from "../middleware/upload.middleware";
import {
  listSignatoriesValidation,
  signatoryIdParamValidation,
  updateSignatoryValidation,
  writeSignatoryValidation,
} from "../validations/signatory.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", listSignatoriesValidation, validate, signatoryController.list);
router.post("/", writeSignatoryValidation, validate, signatoryController.create);
router.patch("/:id", updateSignatoryValidation, validate, signatoryController.update);
router.delete("/:id", signatoryIdParamValidation, validate, signatoryController.remove);
router.post(
  "/:id/signature",
  signatoryIdParamValidation,
  validate,
  uploadReportAsset,
  signatoryController.uploadImage,
);

export { router as signatoryRouter };
