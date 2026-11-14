import { body, param, query } from "express-validator";
import type { WebBannerPlacement } from "@prisma/client";

const WEB_BANNER_PLACEMENTS: WebBannerPlacement[] = ["HOME", "CITY"];

const webBannerBodyValidation = [
  body("placement")
    .isIn(WEB_BANNER_PLACEMENTS)
    .withMessage(`placement must be one of ${WEB_BANNER_PLACEMENTS.join(", ")}`),
  // Required for a CITY banner, which renders the title as its headline.
  // A HOME banner is artwork only — the hero paints its own heading over it —
  // so demanding a title there would be asking for a string nobody reads.
  body("title")
    .if(body("placement").equals("CITY"))
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage("Enter a title (max 120 chars)"),
  body("title")
    .if(body("placement").equals("HOME"))
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),
  body("subtitle").optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }),
  body("badge").optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 40 }),
  body("imageUrl").trim().isLength({ min: 1 }).withMessage("Upload a banner image"),
  // Optional: a slide with no package is a pure promo — no price block.
  body("packageId")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Invalid package"),
  body("linkUrl").optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 300 }),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const webBannerIdParamValidation = [
  param("id").isUUID().withMessage("Invalid web banner id"),
];

export const listWebBannersValidation = [
  query("placement").optional().isIn(WEB_BANNER_PLACEMENTS),
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createWebBannerValidation = [...webBannerBodyValidation];
export const updateWebBannerValidation = [
  ...webBannerIdParamValidation,
  ...webBannerBodyValidation,
];

export const setWebBannerStatusValidation = [
  ...webBannerIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const reorderWebBannersValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*").isUUID().withMessage("ids must contain valid web banner ids"),
];
