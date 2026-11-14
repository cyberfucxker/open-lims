import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as blogPostService from "../services/blogPost.service";
import type { BlogPostStatus, BlogPostWriteInput } from "../types/blogPost.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, page, pageSize } = req.query as Record<string, string | undefined>;

  const result = await blogPostService.listBlogPosts({
    search,
    status: status as BlogPostStatus | undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.status(200).json(ApiResponse.success("Blog posts retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogPostService.getBlogPost(req.params.id);

  res.status(200).json(ApiResponse.success("Blog post retrieved successfully", post));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as BlogPostWriteInput;

  const post = await blogPostService.createBlogPost(values);

  res.status(201).json(ApiResponse.success("Blog post created successfully", post));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as BlogPostWriteInput;

  const post = await blogPostService.updateBlogPost(req.params.id, values);

  res.status(200).json(ApiResponse.success("Blog post updated successfully", post));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await blogPostService.deleteBlogPost(req.params.id);

  res.status(200).json(ApiResponse.success("Blog post deleted successfully"));
});
