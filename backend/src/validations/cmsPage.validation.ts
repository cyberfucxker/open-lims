import { body, param, query } from "express-validator";
import { CMS_APP_TYPE_VALUES, CMS_PAGE_STATUS_VALUES } from "../types/cmsPage.types";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const cmsPageBodyValidation = [
  body("appType")
    .isIn(CMS_APP_TYPE_VALUES)
    .withMessage(`appType must be one of ${CMS_APP_TYPE_VALUES.join(", ")}`),
  body("title").trim().isLength({ min: 2, max: 200 }).withMessage("Enter a page title"),
  body("slug")
    .optional({ checkFalsy: true })
    .trim()
    .toLowerCase()
    .matches(SLUG_RE)
    .withMessage("Slug must be lowercase letters, numbers and hyphens only"),
  body("content").trim().isLength({ min: 1 }).withMessage("Page content is required"),
  body("metaTitle")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Meta title must be under 200 characters"),
  body("metaDescription")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Meta description must be under 300 characters"),
  body("status")
    .optional()
    .isIn(CMS_PAGE_STATUS_VALUES)
    .withMessage(`status must be one of ${CMS_PAGE_STATUS_VALUES.join(", ")}`),
];

export const cmsPageIdParamValidation = [param("id").isUUID().withMessage("Invalid page id")];

export const listCmsPagesValidation = [
  query("appType").optional().isIn(CMS_APP_TYPE_VALUES),
  query("status").optional().isIn(CMS_PAGE_STATUS_VALUES),
  query("search").optional().trim(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createCmsPageValidation = [...cmsPageBodyValidation];
export const updateCmsPageValidation = [...cmsPageIdParamValidation, ...cmsPageBodyValidation];

export const setCmsPageStatusValidation = [
  ...cmsPageIdParamValidation,
  body("status")
    .isIn(CMS_PAGE_STATUS_VALUES)
    .withMessage(`status must be one of ${CMS_PAGE_STATUS_VALUES.join(", ")}`),
];

export const publicCmsPageParamValidation = [
  param("appType")
    .customSanitizer((value: string) => value?.toUpperCase())
    .isIn(CMS_APP_TYPE_VALUES)
    .withMessage("Invalid app type"),
  param("slug").trim().toLowerCase().matches(SLUG_RE).withMessage("Invalid page slug"),
];
