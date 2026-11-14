import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export type CouponDiscountType = "FLAT" | "PERCENTAGE";
export type CouponApplicableOn = "ALL" | "TESTS" | "PACKAGES";
export type CouponPlatformRestriction = "ALL" | "APP_ONLY" | "WEB_ONLY";

/** Mirrors the backend's `CouponDto` (GET /coupons) — a promotional discount
 *  code redeemable via the patient app's `POST /api/v1/app/user/checkout/apply-coupon`. */
export interface Coupon {
  id: string;
  code: string;
  title: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minSubtotal: number | null;
  applicableOn: CouponApplicableOn;
  /** Enforced at redemption time (unlike `applicableOn`) — see the backend's
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

export interface CouponListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CouponFormValues {
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

export async function fetchCoupons(
  params: CouponListParams = {},
): Promise<PaginatedResult<Coupon>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<Coupon>>>("/coupons", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as PaginatedResult<Coupon>;
}

export async function createCouponApi(values: CouponFormValues): Promise<Coupon> {
  const response = await httpClient.post<ApiResponseBody<Coupon>>("/coupons", values, {
    suppressErrorToast: true,
  });
  return response.data.data as Coupon;
}

export async function updateCouponApi(id: string, values: CouponFormValues): Promise<Coupon> {
  const response = await httpClient.put<ApiResponseBody<Coupon>>(`/coupons/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as Coupon;
}

export async function setCouponStatusApi(id: string, isActive: boolean): Promise<Coupon> {
  const response = await httpClient.patch<ApiResponseBody<Coupon>>(
    `/coupons/${id}/status`,
    { isActive },
    { suppressErrorToast: true },
  );
  return response.data.data as Coupon;
}

export async function deleteCouponApi(id: string): Promise<void> {
  await httpClient.delete(`/coupons/${id}`, { suppressErrorToast: true });
}

export async function setCouponHomeFeatureApi(id: string, showOnHome: boolean): Promise<Coupon> {
  const response = await httpClient.patch<ApiResponseBody<Coupon>>(
    `/coupons/${id}/home`,
    { showOnHome },
    { suppressErrorToast: true },
  );
  return response.data.data as Coupon;
}

export async function reorderHomeCouponsApi(ids: string[]): Promise<void> {
  await httpClient.patch("/coupons/reorder-home", { ids }, { suppressErrorToast: true });
}
