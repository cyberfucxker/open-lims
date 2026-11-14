import { body, param, query } from "express-validator";
import { AI_MODELS } from "../services/whatsapp/settings.service";

export const idParamValidation = [param("id").isUUID().withMessage("Invalid id")];

export const updateSettingsValidation = [
  body("enabled").optional().isBoolean(),
  body("anthropicKey").optional().isString().isLength({ max: 300 }),
  body("model")
    .optional()
    .isIn([...AI_MODELS])
    .withMessage("Unknown model"),
  body("maxRepliesPerHour").optional().isInt({ min: 1, max: 200 }).toInt(),
  body("voiceEnabled").optional().isBoolean(),
  body("sttProvider").optional().isIn(["groq", "openai"]),
  body("sttKey").optional().isString().isLength({ max: 300 }),
  body("brandName").optional().trim().isLength({ min: 1, max: 100 }),
  body("businessInstructions").optional().isString().isLength({ max: 8000 }),
];

export const accountValidation = [
  body("label").optional().trim().isLength({ max: 100 }),
  body("phoneNumberId")
    .optional()
    .trim()
    .matches(/^\d{5,50}$/)
    .withMessage("Phone number id is numeric"),
  body("wabaId").optional().trim().isLength({ max: 50 }),
  body("displayPhone").optional().trim().isLength({ max: 20 }),
  body("accessToken").optional().isString().isLength({ max: 1000 }),
  body("appSecret").optional().isString().isLength({ max: 200 }),
  body("isActive").optional().isBoolean(),
];

export const knowledgeValidation = [
  body("title").optional().trim().isLength({ min: 1, max: 200 }),
  body("body").optional().trim().isLength({ min: 1, max: 4000 }),
  body("isActive").optional().isBoolean(),
  body("sortOrder").optional().isInt().toInt(),
];

export const mappingValidation = [
  body("concern").optional().trim().isLength({ min: 1, max: 200 }),
  body("keywords").optional().isArray({ max: 40 }),
  body("keywords.*").optional().isString().isLength({ max: 60 }),
  body("testIds").optional().isArray({ max: 20 }),
  body("testIds.*").optional().isUUID(),
  body("packageIds").optional().isArray({ max: 10 }),
  body("packageIds.*").optional().isUUID(),
  body("notes").optional({ values: "null" }).isString().isLength({ max: 1000 }),
  body("isActive").optional().isBoolean(),
];

export const tryItValidation = [
  body("message").trim().isLength({ min: 1, max: 1000 }).withMessage("Type a message"),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^\+?\d{10,13}$/)
    .withMessage("Invalid phone"),
  body("history").optional().isArray({ max: 13 }),
  body("history.*.role").optional().isIn(["user", "assistant"]),
  body("history.*.text").optional().isString().isLength({ max: 1000 }),
];

export const staffReplyValidation = [
  ...idParamValidation,
  body("body").trim().isLength({ min: 1, max: 4000 }).withMessage("Message is empty"),
];

export const takeoverValidation = [...idParamValidation, body("humanTakeover").isBoolean()];

export const listValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("view").optional().isIn(["all", "handoff", "takeover"]),
  query("search").optional().trim().isLength({ max: 50 }),
  query("status")
    .optional()
    .isIn([
      "replied",
      "skipped",
      "handoff",
      "error",
      "SCHEDULED",
      "SENT",
      "SKIPPED_REBOOKED",
      "SKIPPED",
      "FAILED",
      "BOOKED",
    ]),
  query("handoff").optional().isBoolean().toBoolean(),
  query("dryRun").optional().isBoolean().toBoolean(),
];
