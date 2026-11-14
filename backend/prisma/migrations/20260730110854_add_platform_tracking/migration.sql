-- CreateEnum
CREATE TYPE "AppPlatform" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- AlterTable
ALTER TABLE "app_orders" ADD COLUMN     "platform" "AppPlatform";

-- AlterTable
ALTER TABLE "app_users" ADD COLUMN     "platform" "AppPlatform";
