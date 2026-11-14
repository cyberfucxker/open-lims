import { Router } from "express";
import { param, query } from "express-validator";
import * as blogController from "../../controllers/app/blog.controller";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

// Fully public — a guest reads articles before ever logging in, same
// reasoning as catalogDetail.routes.ts's detail routes.
router.get(
  "/blog",
  [query("search").optional().trim(), query("category").optional().trim()],
  validate,
  blogController.list,
);

router.get(
  "/blog/:slug",
  [param("slug").trim().isLength({ min: 1 })],
  validate,
  blogController.getBySlug,
);

export { router as appBlogRouter };
