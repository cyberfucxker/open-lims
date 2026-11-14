import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as addressService from "../../services/app/address.service";
import type { AddressInput } from "../../services/app/address.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const addresses = await addressService.listAddresses(appUser.id);
  res.status(200).json(AppApiResponse.success("Addresses fetched successfully", addresses));
});

export const listAreas = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { city_id } = req.query as Record<string, string | undefined>;
  const areas = await addressService.listAreasForCity(appUser.id, city_id);
  res.status(200).json(AppApiResponse.success("Areas fetched successfully", areas));
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { is_default, ...input } = req.body as AddressInput & { is_default: "0" | "1" };

  const address = await addressService.addAddress(appUser.id, input, is_default === "1");

  res.status(201).json(AppApiResponse.success("Address added successfully", address));
});

export const edit = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { address_id, ...input } = req.body as AddressInput & { address_id: string };

  const address = await addressService.editAddress(appUser.id, address_id, input);

  res.status(200).json(AppApiResponse.success("Address updated successfully", address));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { address_id: addressId } = req.body as { address_id: string };

  await addressService.deleteAddress(appUser.id, addressId);

  res.status(200).json(AppApiResponse.success("Address deleted successfully"));
});

export const setDefault = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { address_id: addressId } = req.body as { address_id: string };

  await addressService.setDefaultAddress(appUser.id, addressId);

  res.status(200).json(AppApiResponse.success("Default address updated successfully"));
});
