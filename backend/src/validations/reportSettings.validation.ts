import { body, param } from "express-validator";
import { REPORT_ASSET_TYPES } from "../types/reportSettings.types";

const BARCODE_POSITIONS = ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"];
const PAGE_SIZES = ["A4", "LETTER"];
const WATERMARK_MODES = ["NONE", "TEXT", "IMAGE"];
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const settingsBodyValidation = [
  body("labName").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("primaryColor")
    .optional()
    .matches(HEX_COLOR)
    .withMessage("Color must be a hex value like #RRGGBB"),
  body("headerText").optional({ values: "falsy" }).trim(),
  body("footerText").optional({ values: "falsy" }).trim(),
  body("showFooter")
    .optional()
    .isBoolean()
    .withMessage("showFooter must be true or false")
    .toBoolean(),
  body("watermarkMode").optional().isIn(WATERMARK_MODES).withMessage("Invalid watermark mode"),
  body("watermarkText").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("showSignature")
    .optional()
    .isBoolean()
    .withMessage("showSignature must be true or false")
    .toBoolean(),
  body("minSignaturesRequired")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("minSignaturesRequired must be between 1 and 5")
    .toInt(),
  body("showBarcode")
    .optional()
    .isBoolean()
    .withMessage("showBarcode must be true or false")
    .toBoolean(),
  body("showQrCode")
    .optional()
    .isBoolean()
    .withMessage("showQrCode must be true or false")
    .toBoolean(),
  body("barcodePosition")
    .optional()
    .isIn(BARCODE_POSITIONS)
    .withMessage("Invalid barcode position"),
  body("showPageNumber")
    .optional()
    .isBoolean()
    .withMessage("showPageNumber must be true or false")
    .toBoolean(),
  // `{ values: "falsy" }` on these numeric fields matters specifically for
  // the live preview: while a user is actively retyping a margin/font-size
  // value, the input is briefly "" (or the frontend sends NaN, which
  // JSON-serializes to null) before the new digits land. Without this, that
  // transient empty value fails `.isInt()`/`.isFloat()` outright and the
  // preview request 400s mid-edit instead of just falling back to the last
  // good value for that one field.
  body("marginTop").optional({ values: "falsy" }).isInt({ min: 0, max: 200 }).toInt(),
  body("marginRight").optional({ values: "falsy" }).isInt({ min: 0, max: 200 }).toInt(),
  body("marginBottom").optional({ values: "falsy" }).isInt({ min: 0, max: 200 }).toInt(),
  body("marginLeft").optional({ values: "falsy" }).isInt({ min: 0, max: 200 }).toInt(),
  body("lineSpacing").optional({ values: "falsy" }).isFloat({ min: 0.8, max: 2.5 }).toFloat(),
  body("fontSize").optional({ values: "falsy" }).isInt({ min: 6, max: 18 }).toInt(),
  body("pageSize").optional().isIn(PAGE_SIZES).withMessage("Invalid page size"),
  body("patientFields").optional().isObject().withMessage("patientFields must be an object"),
  body("patientFields.patientId").optional().isBoolean().toBoolean(),
  body("patientFields.ageGender").optional().isBoolean().toBoolean(),
  body("patientFields.mobile").optional().isBoolean().toBoolean(),
  body("patientFields.billNo").optional().isBoolean().toBoolean(),
  body("patientFields.reportDate").optional().isBoolean().toBoolean(),
  body("patientFields.approvedDate").optional().isBoolean().toBoolean(),
  body("patientFields.emergency").optional().isBoolean().toBoolean(),
  body("patientFields.status").optional().isBoolean().toBoolean(),
  body("reportFields").optional().isObject().withMessage("reportFields must be an object"),
  body("reportFields.unit").optional().isBoolean().toBoolean(),
  body("reportFields.referenceRange").optional().isBoolean().toBoolean(),
  body("reportFields.method").optional().isBoolean().toBoolean(),
  body("reportFields.remarks").optional().isBoolean().toBoolean(),
  body("reportFields.flag").optional().isBoolean().toBoolean(),
];

export const updateReportSettingsValidation = [...settingsBodyValidation];

// The preview endpoint accepts the exact same shape as an update — every
// field is an optional override merged over the saved settings.
export const previewReportSettingsValidation = [...settingsBodyValidation];

export const assetTypeParamValidation = [
  param("assetType").isIn(REPORT_ASSET_TYPES).withMessage("Invalid asset type"),
];
