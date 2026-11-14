import { Router } from "express";
import * as blogPostController from "../controllers/blogPost.controller";
import * as bannerController from "../controllers/banner.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadBannerImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  blogPostIdParamValidation,
  createBlogPostValidation,
  listBlogPostsValidation,
  updateBlogPostValidation,
} from "../validations/blogPost.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// Literal path before "/:id" — same convention as webBanner.routes.ts.
// Shares the app-banner uploader and the same `/uploads` destination — one
// image store, nothing about a blog cover photo differs from a banner image.
router.post("/upload", uploadBannerImage, bannerController.uploadImage);

router.get("/", listBlogPostsValidation, validate, blogPostController.list);
router.get("/:id", blogPostIdParamValidation, validate, blogPostController.getById);
router.post("/", createBlogPostValidation, validate, blogPostController.create);
router.put("/:id", updateBlogPostValidation, validate, blogPostController.update);
router.delete("/:id", blogPostIdParamValidation, validate, blogPostController.remove);

export { router as blogPostRouter };
