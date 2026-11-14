export type CouponDiscountType = "FLAT" | "PERCENTAGE";
export type CouponApplicableOn = "ALL" | "TESTS" | "PACKAGES";
export type CouponPlatformRestriction = "ALL" | "APP_ONLY" | "WEB_ONLY";

export interface CouponDto {
  id: string;
  code: string;
  title: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minSubtotal: number | null;
  applicableOn: CouponApplicableOn;
  /** Enforced at redemption time, unlike `applicableOn` — see
   *  `checkCouponEligibility`. */
  platformRestriction: CouponPlatformRestriction;
  validFrom: string | null;
  validTo: string | null;
  usageLimitPerUser: number | null;
  totalUsageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  showOnHome: boolean;
  homeSortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponWriteData {
  code: string;
  title: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minSubtotal?: number | null;
  applicableOn?: CouponApplicableOn;
  platformRestriction?: CouponPlatformRestriction;
  validFrom?: string | null;
  validTo?: string | null;
  usageLimitPerUser?: number | null;
  totalUsageLimit?: number | null;
  isActive?: boolean;
}

export interface ListCouponsParams {
  search?: string;
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListCouponsResult {
  rows: CouponDto[];
  total: number;
}
