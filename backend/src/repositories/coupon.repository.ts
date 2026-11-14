import type { Coupon, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { CouponDto } from "../types/coupon.types";

type CouponWithCount = Coupon & { _count: { redemptions: number } };

export interface ListCouponsFilter {
  search?: string;
  isActive?: string;
  skip: number;
  take: number;
}

export interface CouponWriteInput {
  code: string;
  title: string;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minSubtotal?: number | null;
  applicableOn?: "ALL" | "TESTS" | "PACKAGES";
  platformRestriction?: "ALL" | "APP_ONLY" | "WEB_ONLY";
  validFrom?: string | null;
  validTo?: string | null;
  usageLimitPerUser?: number | null;
  totalUsageLimit?: number | null;
  isActive?: boolean;
}

/** Maps a Prisma row (with `_count.redemptions`) to the exact shape the frontend expects. */
export function toCouponDto(coupon: CouponWithCount): CouponDto {
  return {
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
    minSubtotal: coupon.minSubtotal ? Number(coupon.minSubtotal) : null,
    applicableOn: coupon.applicableOn,
    platformRestriction: coupon.platformRestriction,
    validFrom: coupon.validFrom ? coupon.validFrom.toISOString() : null,
    validTo: coupon.validTo ? coupon.validTo.toISOString() : null,
    usageLimitPerUser: coupon.usageLimitPerUser,
    totalUsageLimit: coupon.totalUsageLimit,
    usedCount: coupon._count.redemptions,
    isActive: coupon.isActive,
    showOnHome: coupon.showOnHome,
    homeSortOrder: coupon.homeSortOrder,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListCouponsFilter, "search" | "isActive">,
): Prisma.CouponWhereInput {
  const where: Prisma.CouponWhereInput = {};

  if (filter.search) {
    where.code = { contains: filter.search, mode: "insensitive" };
  }
  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }

  return where;
}

export async function listCoupons(
  filter: ListCouponsFilter,
): Promise<{ rows: CouponWithCount[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.coupon.count({ where }),
  ]);

  return { rows, total };
}

export function findCouponById(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
    include: { _count: { select: { redemptions: true } } },
  });
}

function toPrismaData(data: CouponWriteInput) {
  return {
    code: data.code,
    title: data.title,
    discountType: data.discountType,
    discountValue: data.discountValue,
    maxDiscountAmount: data.maxDiscountAmount ?? null,
    minSubtotal: data.minSubtotal ?? null,
    applicableOn: data.applicableOn ?? "ALL",
    platformRestriction: data.platformRestriction ?? "ALL",
    validFrom: data.validFrom ? new Date(data.validFrom) : null,
    validTo: data.validTo ? new Date(data.validTo) : null,
    usageLimitPerUser: data.usageLimitPerUser ?? null,
    totalUsageLimit: data.totalUsageLimit ?? null,
  };
}

export function createCoupon(data: CouponWriteInput) {
  return prisma.coupon.create({
    data: { ...toPrismaData(data), isActive: data.isActive ?? true },
    include: { _count: { select: { redemptions: true } } },
  });
}

export function updateCoupon(id: string, data: CouponWriteInput) {
  return prisma.coupon.update({
    where: { id },
    data: toPrismaData(data),
    include: { _count: { select: { redemptions: true } } },
  });
}

export function setCouponStatus(id: string, isActive: boolean) {
  return prisma.coupon.update({
    where: { id },
    data: { isActive },
    include: { _count: { select: { redemptions: true } } },
  });
}

export async function nextHomeSortOrder(): Promise<number> {
  const last = await prisma.coupon.findFirst({
    where: { showOnHome: true },
    orderBy: { homeSortOrder: "desc" },
  });
  return (last?.homeSortOrder ?? -1) + 1;
}

export async function setCouponHomeFeature(id: string, showOnHome: boolean) {
  const homeSortOrder = showOnHome ? await nextHomeSortOrder() : 0;
  return prisma.coupon.update({
    where: { id },
    data: { showOnHome, homeSortOrder },
    include: { _count: { select: { redemptions: true } } },
  });
}

export function reorderHomeCoupons(ids: string[]) {
  return prisma.$transaction(
    ids.map((id, index) => prisma.coupon.update({ where: { id }, data: { homeSortOrder: index } })),
  );
}

export function countCouponRedemptions(id: string): Promise<number> {
  return prisma.couponRedemption.count({ where: { couponId: id } });
}

export function deleteCoupon(id: string) {
  return prisma.coupon.delete({ where: { id } });
}
