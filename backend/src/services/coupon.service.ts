import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as couponRepository from "../repositories/coupon.repository";
import { toCouponDto, type CouponWriteInput } from "../repositories/coupon.repository";
import type { CouponDto, ListCouponsParams, ListCouponsResult } from "../types/coupon.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Coupon not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A coupon with this code already exists");
      }
    }
    throw error;
  }
}

function assertValidityRange(values: CouponWriteInput): void {
  if (values.validFrom && values.validTo && new Date(values.validTo) < new Date(values.validFrom)) {
    throw ApiError.badRequest("Valid To date must be on or after Valid From");
  }
  if (values.discountType === "PERCENTAGE" && values.discountValue > 100) {
    throw ApiError.badRequest("Percentage discount cannot exceed 100");
  }
}

export async function listCoupons(params: ListCouponsParams): Promise<ListCouponsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await couponRepository.listCoupons({
    search: params.search,
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toCouponDto), total };
}

export async function getCoupon(id: string): Promise<CouponDto> {
  const coupon = await couponRepository.findCouponById(id);
  if (!coupon) {
    throw ApiError.notFound("Coupon not found");
  }
  return toCouponDto(coupon);
}

export async function createCoupon(values: CouponWriteInput): Promise<CouponDto> {
  assertValidityRange(values);
  const coupon = await withTranslatedErrors(() =>
    couponRepository.createCoupon({ ...values, code: values.code.toUpperCase() }),
  );
  return toCouponDto(coupon);
}

export async function updateCoupon(id: string, values: CouponWriteInput): Promise<CouponDto> {
  assertValidityRange(values);
  const coupon = await withTranslatedErrors(() =>
    couponRepository.updateCoupon(id, { ...values, code: values.code.toUpperCase() }),
  );
  return toCouponDto(coupon);
}

export async function setCouponStatus(id: string, isActive: boolean): Promise<CouponDto> {
  const coupon = await withTranslatedErrors(() => couponRepository.setCouponStatus(id, isActive));
  return toCouponDto(coupon);
}

export async function setCouponHomeFeature(id: string, showOnHome: boolean): Promise<CouponDto> {
  const coupon = await withTranslatedErrors(() =>
    couponRepository.setCouponHomeFeature(id, showOnHome),
  );
  return toCouponDto(coupon);
}

export async function reorderHomeCoupons(ids: string[]): Promise<void> {
  await withTranslatedErrors(() => couponRepository.reorderHomeCoupons(ids));
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupon = await couponRepository.findCouponById(id);
  if (!coupon) {
    throw ApiError.notFound("Coupon not found");
  }
  if (coupon._count.redemptions > 0) {
    throw ApiError.badRequest(
      "This coupon has already been redeemed by customers — deactivate it instead of deleting.",
    );
  }
  await withTranslatedErrors(() => couponRepository.deleteCoupon(id));
}
