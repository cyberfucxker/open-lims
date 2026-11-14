import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as blogPostService from "../../services/blogPost.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, category } = req.query as Record<string, string | undefined>;

  const result = await blogPostService.listPublicBlogPosts({ search, category });

  res.status(200).json(AppApiResponse.success("Articles retrieved successfully", result));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const detail = await blogPostService.getPublicBlogPostBySlug(req.params.slug);

  res.status(200).json(AppApiResponse.success("Article retrieved successfully", detail));
});
