-- CreateEnum
CREATE TYPE "CouponPlatformRestriction" AS ENUM ('ALL', 'APP_ONLY', 'WEB_ONLY');

-- AlterTable
ALTER TABLE "app_coupons" ADD COLUMN     "platform_restriction" "CouponPlatformRestriction" NOT NULL DEFAULT 'ALL';
