import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as couponService from "../services/coupon.service";
import type { CouponWriteData, ListCouponsParams } from "../types/coupon.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, isActive, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListCouponsParams = {
    search,
    isActive,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await couponService.listCoupons(params);

  res.status(200).json(ApiResponse.success("Coupons retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.getCoupon(req.params.id);

  res.status(200).json(ApiResponse.success("Coupon retrieved successfully", coupon));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CouponWriteData;

  const coupon = await couponService.createCoupon(values);

  res.status(201).json(ApiResponse.success("Coupon created successfully", coupon));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CouponWriteData;

  const coupon = await couponService.updateCoupon(req.params.id, values);

  res.status(200).json(ApiResponse.success("Coupon updated successfully", coupon));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };

  const coupon = await couponService.setCouponStatus(req.params.id, isActive);

  res.status(200).json(ApiResponse.success("Coupon status updated successfully", coupon));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await couponService.deleteCoupon(req.params.id);

  res.status(200).json(ApiResponse.success("Coupon deleted successfully"));
});

export const setHomeFeature = asyncHandler(async (req: Request, res: Response) => {
  const { showOnHome } = req.body as { showOnHome: boolean };

  const coupon = await couponService.setCouponHomeFeature(req.params.id, showOnHome);

  res.status(200).json(ApiResponse.success("Coupon home visibility updated successfully", coupon));
});

export const reorderHome = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };

  await couponService.reorderHomeCoupons(ids);

  res.status(200).json(ApiResponse.success("Home coupon order updated successfully"));
});
