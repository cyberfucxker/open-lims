import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as landingPageService from "../services/landingPage.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(200)
    .json(
      ApiResponse.success("Landing pages retrieved", await landingPageService.listLandingPages()),
    );
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(200)
    .json(
      ApiResponse.success(
        "Landing page retrieved",
        await landingPageService.getLandingPage(req.params.id),
      ),
    );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await landingPageService.createLandingPage(
    req.body as landingPageService.LandingPageInput,
  );
  res.status(201).json(ApiResponse.success("Landing page created", data));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await landingPageService.updateLandingPage(
    req.params.id,
    req.body as landingPageService.LandingPageInput,
  );
  res.status(200).json(ApiResponse.success("Landing page saved", data));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await landingPageService.setLandingPageStatus(
    req.params.id,
    Boolean(req.body.isActive),
  );
  res
    .status(200)
    .json(
      ApiResponse.success(
        data.isActive ? "Landing page turned on" : "Landing page turned off",
        data,
      ),
    );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await landingPageService.deleteLandingPage(req.params.id);
  res.status(200).json(ApiResponse.success("Landing page deleted"));
});
