import { body } from "express-validator";

export const sendPushCampaignValidation = [
  body("audience").isObject().withMessage("audience is required"),
  body("audience.type")
    .isIn(["all", "filtered", "individual", "individual_phlebo"])
    .withMessage("audience.type must be all, filtered, individual or individual_phlebo"),
  body("audience.cityId").optional({ checkFalsy: true }).isUUID().withMessage("Invalid city id"),
  body("audience.minOrderCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("minOrderCount must be a positive integer")
    .toInt(),
  body("audience.appUserId")
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage("Invalid customer id"),
  body("audience.phleboId")
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage("Invalid phlebotomist id"),
  body("title").trim().isLength({ min: 1, max: 200 }).withMessage("Title is required"),
  body("body").trim().isLength({ min: 1, max: 1000 }).withMessage("Message body is required"),
];
