import { body, param, query } from "express-validator";
import { BLOG_POST_STATUS_VALUES } from "../types/blogPost.types";

const blogPostBodyValidation = [
  body("title").trim().isLength({ min: 3, max: 200 }).withMessage("Enter a title (3-200 chars)"),
  body("slug")
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers and hyphens only")
    .isLength({ max: 200 }),
  body("category").trim().isLength({ min: 1, max: 80 }).withMessage("Enter a category"),
  body("readMinutes").isInt({ min: 1, max: 60 }).withMessage("Read minutes must be 1-60").toInt(),
  body("excerpt").trim().isLength({ min: 1, max: 500 }).withMessage("Enter an excerpt"),
  body("body").isArray({ min: 1 }).withMessage("Add at least one paragraph"),
  body("body.*").trim().isLength({ min: 1 }).withMessage("Paragraphs can't be empty"),
  body("imageUrl").optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 2000 }),
  body("status")
    .isIn(BLOG_POST_STATUS_VALUES)
    .withMessage(`status must be one of ${BLOG_POST_STATUS_VALUES.join(", ")}`),
];

export const blogPostIdParamValidation = [param("id").isUUID().withMessage("Invalid blog post id")];

export const listBlogPostsValidation = [
  query("search").optional().trim(),
  query("status").optional().isIn(BLOG_POST_STATUS_VALUES),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createBlogPostValidation = [...blogPostBodyValidation];
export const updateBlogPostValidation = [...blogPostIdParamValidation, ...blogPostBodyValidation];
