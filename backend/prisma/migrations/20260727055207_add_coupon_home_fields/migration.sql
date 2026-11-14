-- CreateEnum
CREATE TYPE "CouponApplicableOn" AS ENUM ('ALL', 'TESTS', 'PACKAGES');

-- AlterTable
ALTER TABLE "app_coupons" ADD COLUMN     "applicable_on" "CouponApplicableOn" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "home_sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "show_on_home" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" VARCHAR(150) NOT NULL DEFAULT 'Special Offer';
