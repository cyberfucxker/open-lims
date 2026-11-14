-- CreateEnum
CREATE TYPE "AppOrderType" AS ENUM ('CATALOG', 'HOME_VISIT');

-- AlterTable
ALTER TABLE "app_orders" ADD COLUMN     "home_visit_family_member_id" UUID,
ADD COLUMN     "order_type" "AppOrderType" NOT NULL DEFAULT 'CATALOG',
ADD COLUMN     "symptom_notes" TEXT;

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_home_visit_family_member_id_fkey" FOREIGN KEY ("home_visit_family_member_id") REFERENCES "app_family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
