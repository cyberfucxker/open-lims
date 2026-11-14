import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as rechargeOfferRepository from "../repositories/rechargeOffer.repository";
import {
  toRechargeOfferDto,
  type RechargeOfferWriteInput,
} from "../repositories/rechargeOffer.repository";
import type {
  ListRechargeOffersParams,
  ListRechargeOffersResult,
  RechargeOfferDto,
} from "../types/rechargeOffer.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Recharge offer not found");
    }
    throw error;
  }
}

export async function listRechargeOffers(
  params: ListRechargeOffersParams,
): Promise<ListRechargeOffersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await rechargeOfferRepository.listRechargeOffers({
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toRechargeOfferDto), total };
}

export async function getRechargeOffer(id: string): Promise<RechargeOfferDto> {
  const offer = await rechargeOfferRepository.findRechargeOfferById(id);
  if (!offer) {
    throw ApiError.notFound("Recharge offer not found");
  }
  return toRechargeOfferDto(offer);
}

export async function createRechargeOffer(
  values: RechargeOfferWriteInput,
): Promise<RechargeOfferDto> {
  const offer = await rechargeOfferRepository.createRechargeOffer(values);
  return toRechargeOfferDto(offer);
}

export async function updateRechargeOffer(
  id: string,
  values: RechargeOfferWriteInput,
): Promise<RechargeOfferDto> {
  const offer = await withTranslatedErrors(() =>
    rechargeOfferRepository.updateRechargeOffer(id, values),
  );
  return toRechargeOfferDto(offer);
}

export async function setRechargeOfferStatus(
  id: string,
  isActive: boolean,
): Promise<RechargeOfferDto> {
  const offer = await withTranslatedErrors(() =>
    rechargeOfferRepository.setRechargeOfferStatus(id, isActive),
  );
  return toRechargeOfferDto(offer);
}

export async function deleteRechargeOffer(id: string): Promise<void> {
  const existing = await rechargeOfferRepository.findRechargeOfferById(id);
  if (!existing) {
    throw ApiError.notFound("Recharge offer not found");
  }

  const usageCount = await rechargeOfferRepository.countWalletRechargesForOffer(id);
  if (usageCount > 0) {
    throw ApiError.badRequest(
      "Cannot delete a recharge slab that has been used in past recharges — deactivate it instead.",
    );
  }

  await withTranslatedErrors(() => rechargeOfferRepository.deleteRechargeOffer(id));
}
