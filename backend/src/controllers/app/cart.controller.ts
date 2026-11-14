import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as cartService from "../../services/app/cart.service";
import type { RemoveCartInput } from "../../services/app/cart.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const cart = await cartService.getCart(appUser.id, appUser.platform);
  res.status(200).json(AppApiResponse.success("Cart fetched successfully", cart));
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as RemoveCartInput;

  await cartService.removeCartItem(appUser.id, input, appUser.platform);

  res.status(200).json(AppApiResponse.success("Item removed from cart successfully"));
});

export const setFamilyMember = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { family_member_id: familyMemberId, cart_id: cartId } = req.body as {
    family_member_id: string;
    cart_id?: string;
  };

  await cartService.setCartFamilyMember(appUser.id, { familyMemberId, cartId });

  res.status(200).json(AppApiResponse.success("Cart updated successfully"));
});

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { coupon_code: couponCode } = req.body as { coupon_code: string };

  const result = await cartService.applyCoupon(appUser.id, couponCode, appUser.platform);

  // Deliberate dual-outcome design: business-rule rejections (invalid code,
  // below minimum subtotal, etc.) still return HTTP 200 with status:false
  // and no extra nesting — see api.md.
  const body = result.status
    ? AppApiResponse.success(result.message)
    : AppApiResponse.error(result.message);
  res.status(200).json(body);
});

export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);

  await cartService.removeCoupon(appUser.id);

  res.status(200).json(AppApiResponse.success("Coupon removed from cart"));
});
