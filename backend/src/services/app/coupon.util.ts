import type { AppPlatform, Coupon } from "@prisma/client";
import { prisma } from "../../config/database";

export interface CouponEligibility {
  valid: boolean;
  reason?: string;
  discountAmount: number;
}

/** Shared by Cart (Get Cart preview / Apply Coupon) and Orders (Review Cart /
 *  Confirm Order) so a coupon can never be judged eligible in one place and
 *  ineligible in another. Recomputes everything server-side against the
 *  live `subtotal` passed in — never trusts a client-sent subtotal. */
export async function checkCouponEligibility(
  coupon: Coupon,
  subtotal: number,
  appUserId: string,
  platform: AppPlatform,
): Promise<CouponEligibility> {
  const now = new Date();

  if (!coupon.isActive) {
    return { valid: false, reason: "This coupon is no longer active", discountAmount: 0 };
  }
  if (coupon.platformRestriction === "APP_ONLY" && platform === "WEB") {
    return {
      valid: false,
      reason: "This coupon is only available in our app — download it to use this code",
      discountAmount: 0,
    };
  }
  if (coupon.platformRestriction === "WEB_ONLY" && platform !== "WEB") {
    return {
      valid: false,
      reason: "This coupon is only available on our website",
      discountAmount: 0,
    };
  }
  if (coupon.validFrom && coupon.validFrom > now) {
    return { valid: false, reason: "This coupon is not yet valid", discountAmount: 0 };
  }
  if (coupon.validTo && coupon.validTo < now) {
    return { valid: false, reason: "This coupon has expired", discountAmount: 0 };
  }
  if (coupon.minSubtotal && subtotal < Number(coupon.minSubtotal)) {
    return {
      valid: false,
      reason: `Add items worth at least ₹${coupon.minSubtotal} to use this coupon`,
      discountAmount: 0,
    };
  }

  if (coupon.totalUsageLimit !== null) {
    const totalUsed = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
    if (totalUsed >= coupon.totalUsageLimit) {
      return { valid: false, reason: "This coupon has been fully redeemed", discountAmount: 0 };
    }
  }
  if (coupon.usageLimitPerUser !== null) {
    const usedByUser = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, appUserId },
    });
    if (usedByUser >= coupon.usageLimitPerUser) {
      return { valid: false, reason: "You have already used this coupon", discountAmount: 0 };
    }
  }

  const rawDiscount =
    coupon.discountType === "FLAT"
      ? Number(coupon.discountValue)
      : (subtotal * Number(coupon.discountValue)) / 100;
  const discountAmount = Math.min(
    Math.round(rawDiscount * 100) / 100,
    coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : rawDiscount,
    subtotal,
  );

  return { valid: true, discountAmount };
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  return prisma.coupon.findFirst({ where: { code: { equals: code.trim(), mode: "insensitive" } } });
}
