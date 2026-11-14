import type { Prisma, RechargeOffer } from "@prisma/client";
import { prisma } from "../config/database";
import type { RechargeOfferDto } from "../types/rechargeOffer.types";

export interface ListRechargeOffersFilter {
  isActive?: string;
  skip: number;
  take: number;
}

export interface RechargeOfferWriteInput {
  rechargeAmount: number;
  bonusAmount: number;
  isActive?: boolean;
}

/** Maps a Prisma row to the exact shape the admin frontend expects. */
export function toRechargeOfferDto(offer: RechargeOffer): RechargeOfferDto {
  return {
    id: offer.id,
    rechargeAmount: Number(offer.rechargeAmount),
    bonusAmount: Number(offer.bonusAmount),
    creditAmount: Number(offer.creditAmount),
    isActive: offer.isActive,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListRechargeOffersFilter, "isActive">,
): Prisma.RechargeOfferWhereInput {
  const where: Prisma.RechargeOfferWhereInput = {};

  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }

  return where;
}

export async function listRechargeOffers(
  filter: ListRechargeOffersFilter,
): Promise<{ rows: RechargeOffer[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.rechargeOffer.findMany({
      where,
      orderBy: { rechargeAmount: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.rechargeOffer.count({ where }),
  ]);

  return { rows, total };
}

export function findRechargeOfferById(id: string) {
  return prisma.rechargeOffer.findUnique({ where: { id } });
}

export function createRechargeOffer(data: RechargeOfferWriteInput) {
  const creditAmount = data.rechargeAmount + data.bonusAmount;
  return prisma.rechargeOffer.create({
    data: {
      rechargeAmount: data.rechargeAmount,
      bonusAmount: data.bonusAmount,
      creditAmount,
      isActive: data.isActive ?? true,
    },
  });
}

export function updateRechargeOffer(id: string, data: RechargeOfferWriteInput) {
  const creditAmount = data.rechargeAmount + data.bonusAmount;
  return prisma.rechargeOffer.update({
    where: { id },
    data: {
      rechargeAmount: data.rechargeAmount,
      bonusAmount: data.bonusAmount,
      creditAmount,
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export function setRechargeOfferStatus(id: string, isActive: boolean) {
  return prisma.rechargeOffer.update({ where: { id }, data: { isActive } });
}

export function countWalletRechargesForOffer(offerId: string) {
  return prisma.walletRecharge.count({ where: { offerId } });
}

export function deleteRechargeOffer(id: string) {
  return prisma.rechargeOffer.delete({ where: { id } });
}
